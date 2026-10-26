"""Author, bake and export the studio with Blender 4.5+.

blender --background --python scripts/create-studio.py -- --cache <portfolio-tools>
Source asset licences are recorded in public/assets/studio/CREDITS.md.
"""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
from importlib.util import spec_from_file_location, module_from_spec
_denoise_spec = spec_from_file_location('studio_denoise', Path(__file__).with_name('studio-denoise.py'))
_denoise_module = module_from_spec(_denoise_spec)
_denoise_spec.loader.exec_module(_denoise_module)

parser = argparse.ArgumentParser()
parser.add_argument('--cache', required=True)
parser.add_argument('--samples', type=int, default=24)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'docs' / 'studio-art'
OUT = ROOT / 'public' / 'assets' / 'studio'
OUT.mkdir(parents=True, exist_ok=True)
CACHE = Path(args.cache)
S = 0.2  # Author in metres; browser scales this master to the established room coordinates.
BAKE_GAINS = {}

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = args.samples
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 4
scene.cycles.glossy_bounces = 3
scene.render.resolution_x = 1440
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.29, .34, .41, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .22
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type != 'CPU'
    if any(device.use for device in prefs.devices):
        scene.cycles.device = 'GPU'
        print('STUDIO: using OPTIX', flush=True)
except Exception as error:
    print('STUDIO: CPU rendering:', error, flush=True)

def linear(hexcolor):
    rgb = [int(hexcolor[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb) + (1,)

def pos(x, y, z):
    return (x * S, -z * S, y * S)

def group(name, x=0, y=0, z=0, angle=0):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    obj.location = pos(x, y, z)
    obj.rotation_euler.z = angle
    obj['studio_id'] = name
    return obj

def material(name, color, roughness=.65, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = linear(color)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    return mat

def texture(mat, file, slot='Base Color', noncolor=False):
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    image = bpy.data.images.load(str(file), check_existing=True)
    if noncolor:
        image.colorspace_settings.name = 'Non-Color'
    node = nodes.new('ShaderNodeTexImage')
    node.image = image
    uv = nodes.new('ShaderNodeUVMap')
    uv.uv_map = 'SurfaceUV'
    links.new(uv.outputs['UV'], node.inputs['Vector'])
    if slot == 'Normal':
        normal = nodes.new('ShaderNodeNormalMap')
        normal.inputs['Strength'].default_value = .28
        links.new(node.outputs['Color'], normal.inputs['Color'])
        links.new(normal.outputs['Normal'], nodes['Principled BSDF'].inputs['Normal'])
    else:
        links.new(node.outputs['Color'], nodes['Principled BSDF'].inputs[slot])
    return node

def artwork(name, filename):
    mat = material(name, '#ffffff', .88)
    texture(mat, ART / (filename + '.png'))
    return mat

def attach(obj, parent, mat):
    if parent:
        obj.parent = parent
    if mat:
        obj.data.materials.append(mat)
    if obj.type == 'MESH':
        if not obj.data.uv_layers:
            obj.data.uv_layers.new(name='SurfaceUV')
        else:
            obj.data.uv_layers[0].name = 'SurfaceUV'
    return obj

def cube(name, parent, size, xyz, mat, bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (size[0] * S, size[2] * S, size[1] * S)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.location = pos(*xyz)
    attach(obj, parent, mat)
    if bevel > 0:
        mod = obj.modifiers.new('Light-catching edges', 'BEVEL')
        mod.width = min(bevel, min(size) * .24) * S
        mod.segments = 3
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
        normals = obj.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=normals.name)
    return obj

def cylinder(name, parent, radius, depth, xyz, mat, axis='y'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=radius * S, depth=depth * S)
    obj = bpy.context.object
    obj.name = name
    obj.location = pos(*xyz)
    if axis == 'x':
        obj.rotation_euler.y = math.pi / 2
    attach(obj, parent, mat)
    for face in obj.data.polygons:
        face.use_smooth = len(face.vertices) == 4
    return obj

def flat_screen(name, parent, width, height, xyz, mat):
    x, y, z = xyz
    verts = [pos(-width / 2, -height / 2, 0), pos(width / 2, -height / 2, 0), pos(width / 2, height / 2, 0), pos(-width / 2, height / 2, 0)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], [(0, 1, 2, 3)])
    mesh.uv_layers.new(name='SurfaceUV')
    for loop, uv in zip(mesh.uv_layers[0].data, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        loop.uv = uv
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.location = pos(x, y, z)
    attach(obj, parent, mat)
    return obj

def sheet(name, parent, width, depth, xyz, mat, curl=.015, gutter=False, segments=(32, 24)):
    nx, nz = segments
    verts, faces = [], []
    for j in range(nz + 1):
        v = j / nz
        for i in range(nx + 1):
            u = i / nx
            x, z = (u - .5) * width, (v - .5) * depth
            rise = curl * ((u ** 10) * ((1 - v) ** 8) + .22 * (v ** 12))
            if gutter:
                rise += .075 * math.exp(-((1 - u) / .105) ** 2) + .025 * math.sin(u * math.pi)
            verts.append(pos(x, rise, z))
    for j in range(nz):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + nx + 1, a + nx + 2, a + 1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    uv = mesh.uv_layers.new(name='SurfaceUV')
    for face in mesh.polygons:
        face.use_smooth = True
        for index in face.loop_indices:
            vertex = mesh.loops[index].vertex_index
            uv.data[index].uv = (vertex % (nx + 1) / nx, 1 - vertex // (nx + 1) / nz)
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.location = pos(*xyz)
    attach(obj, parent, mat)
    return obj

paper = material('Uncoated ivory paper', '#eee6d6', .92)
page_edge = material('Paper edges', '#d7cebd', .9)
aluminium = material('Satin aluminium', '#a8b0b4', .28, .82)
graphite = material('Graphite shell', '#272b2b', .3, .32)
dark = material('Keyboard and rubber', '#181d1d', .54)
brass = material('Aged brass', '#9b8664', .34, .75)
cover = material('Moss linen cover', '#35473d', .88)
manila = material('Manila card', '#b5a17b', .83)
paint = material('Warm mineral wall', '#665e51', .93)
floor = material('Smoked oak floor', '#51493e', .84)
wood = material('Walnut veneer CC0', '#ffffff', .55)
texture(wood, CACHE / 'materials' / 'walnut-Diffuse.jpg')
texture(wood, CACHE / 'materials' / 'walnut-Rough.jpg', 'Roughness', True)
texture(wood, CACHE / 'materials' / 'walnut-nor_gl.jpg', 'Normal', True)
wood['studio_tint'] = [.48, .34, .23]
wood_tree = wood.node_tree
wood_color = next(node for node in wood_tree.nodes if node.type == 'TEX_IMAGE' and node.image.name.startswith('walnut-Diffuse'))
wood_tint = wood_tree.nodes.new('ShaderNodeMixRGB')
wood_tint.blend_type = 'MULTIPLY'
wood_tint.inputs[0].default_value = 1
wood_tint.inputs[2].default_value = (.48, .34, .23, 1)
wood_tree.links.new(wood_color.outputs['Color'], wood_tint.inputs[1])
wood_tree.links.new(wood_tint.outputs['Color'], wood_tree.nodes['Principled BSDF'].inputs['Base Color'])
desk_mat = material('Charcoal felt', '#303633', .96)
for mat in [paint, floor, cover, paper, desk_mat]:
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 240 if mat != paint else 110
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = .12
    bump.inputs['Distance'].default_value = .0006
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], nodes['Principled BSDF'].inputs['Normal'])

architecture = group('architecture')
cube('Floor', architecture, (30, .18, 24), (0, -1.85, 1), floor)
# The back wall has a real opening so Cycles can send light through the window.
for name, size, xyz in [
    ('Left wall panel', (1.25, 12, .22), (-9.4, 4.15, -5.6)),
    ('Right wall panel', (20.5, 12, .22), (5.65, 4.15, -5.6)),
    ('Window lower wall', (4.4, 2.8, .22), (-6.6, -.45, -5.6)),
    ('Window upper wall', (4.4, 4.35, .22), (-6.6, 7.98, -5.6)),
    ('Side wall', (.2, 12, 24), (-10, 4.15, 1))
]:
    cube(name, architecture, size, xyz, paint, .006)
cube('Skirting', architecture, (30, .19, .09), (0, -1.63, -5.43), graphite, .006)
frame = material('Window warm timber', '#746956', .6)
for x in [-8.7, -4.5]:
    cube('Window side frame', architecture, (.13, 4.9, .22), (x, 3.4, -5.47), frame)
for y in [.98, 5.82]:
    cube('Window sill', architecture, (4.4, .14, .4), (-6.6, y, -5.42), frame)
cube('Window mullion', architecture, (.055, 4.75, .15), (-6.6, 3.4, -5.4), frame, .006)
for j in range(7):
    slat = cube('Venetian blind', architecture, (4.13, .04, .25), (-6.6, 5.5 - j * .65, -5.25), frame, .008)
    slat.rotation_euler.x = -.2
for x in [-8.05, -5.15]:
    cylinder('Blind cord', architecture, .006, 4.5, (x, 3.25, -5.14), paper)
sky_mat = material('Window glow', '#e9d4b2', 1)
sky_nodes = sky_mat.node_tree.nodes
sky_shader = sky_nodes.new('ShaderNodeEmission')
sky_shader.inputs['Color'].default_value = linear('#e9d4b2')
sky_shader.inputs['Strength'].default_value = 1.2
sky_mat.node_tree.links.new(sky_shader.outputs[0], sky_nodes['Material Output'].inputs['Surface'])
window_sky = flat_screen('Window backdrop', architecture, 4.16, 4.73, (-6.6, 3.4, -5.76), sky_mat)
window_sky.visible_shadow = False
window_sky.visible_diffuse = False
window_sky['studio_no_shadow'] = True

desk = group('desk')
cube('Walnut desktop', desk, (10, .22, 5.2), (0, .8, 0), wood, .065)
cube('Desktop lower reveal', desk, (9.88, .045, 5.08), (0, .669, 0), material('Walnut edge', '#493c2d', .6), .012)
for x in [-4.32, 4.32]:
    for z in [-1.96, 1.96]:
        cube('Powder-coated desk leg', desk, (.12, 2.5, .12), (x, -.55, z), graphite, .016)
    cube('Steel trestle foot', desk, (.25, .075, 4.3), (x, -1.75, 0), graphite, .025)
cube('Felt desk pad', desk, (6.3, .017, 3.3), (.05, .927, -.55), desk_mat, .035)

monitor = group('novalens', -.25, .936, -1.35)
cube('Monitor weighted base', monitor, (1.15, .045, .68), (0, .023, .03), aluminium, .08)
cube('Monitor neck', monitor, (.14, .62, .1), (0, .34, -.055), aluminium, .024)
cube('Monitor shell', monitor, (3.14, 1.84, .092), (0, 1.47, -.02), graphite, .045)
cube('Monitor lower chin', monitor, (3.06, .07, .018), (0, .59, .035), aluminium, .012)
nova = artwork('NovaLens genuine screen', 'novalens-review')
nova['studio_screen'] = True
screen_node = next(node for node in nova.node_tree.nodes if node.type == 'TEX_IMAGE')
mapping = nova.node_tree.nodes.new('ShaderNodeMapping')
uv_node = next(node for node in nova.node_tree.nodes if node.type == 'UVMAP')
nova.node_tree.links.new(uv_node.outputs['UV'], mapping.inputs['Vector'])
mapping.inputs['Scale'].default_value = (1, .34, 1)
mapping.inputs['Location'].default_value = (0, .28, 0)
nova.node_tree.links.new(mapping.outputs['Vector'], screen_node.inputs['Vector'])
flat_screen('NovaLens display', monitor, 3.01, 1.69, (0, 1.49, .032), nova)

laptop = group('forma', -2.55, .94, .25, .15)
cube('Laptop tapered lower body', laptop, (2.35, .065, 1.66), (0, .038, .2), aluminium, .055)
cube('Inset keyboard well', laptop, (2.11, .016, .77), (0, .078, -.07), dark, .04)
key_mat = material('Soft graphite keycaps', '#333938', .44)
for row in range(5):
    for col in range(13):
        cube('Keyboard cap', laptop, (.134, .016, .105), (-.927 + col * .155, .094, -.35 + row * .14), key_mat, .012)
cube('Space bar', laptop, (.7, .016, .105), (0, .095, .35), key_mat, .012)
cube('Trackpad recess', laptop, (.81, .002, .365), (0, .074, .725), graphite, .035)
cube('Glass trackpad', laptop, (.795, .003, .35), (0, .075, .725), aluminium, .03)
cylinder('Display hinge', laptop, .043, 1.85, (0, .103, -.585), graphite, 'x')
lid = group('Laptop display hinge')
lid.parent = laptop
lid.location = pos(0, .09, -.61)
lid.rotation_euler.x = -.17
cube('Laptop display lid', lid, (2.35, 1.5, .054), (0, .75, 0), aluminium, .045)
cube('Laptop display gasket', lid, (2.29, 1.44, .009), (0, .75, .029), dark, .04)
forma_mat = artwork('Forma genuine screen', 'forma-dashboard')
forma_mat['studio_screen'] = True
flat_screen('Forma display', lid, 2.18, 1.33, (0, .759, .035), forma_mat)
cube('Webcam', lid, (.02, .02, .002), (0, 1.46, .037), dark, .003)

phone = group('atlas', 2.15, .936, .15, -.2)
cube('Phone titanium edge', phone, (.67, .045, 1.36), (0, .025, 0), aluminium, .09)
cube('Phone glass', phone, (.646, .008, 1.334), (0, .052, 0), dark, .085)
atlas_mat = artwork('Atlas genuine screen', 'atlas-route')
atlas_mat['studio_screen'] = True
sheet('Atlas display', phone, .61, 1.285, (0, .058, 0), atlas_mat, 0)
cube('Phone island', phone, (.17, .005, .032), (0, .063, -.573), dark, .014)
cube('Volume button', phone, (.011, .025, .1), (-.339, .029, -.28), aluminium, .003)

notebook = group('sketchbook', -.1, .94, 1.35, -.13)
cube('Hardbound cover', notebook, (2.58, .042, 1.67), (0, .018, 0), cover, .028)
for side in [-1, 1]:
    for layer in range(9):
        edge = sheet('Layered paper edge', notebook, 1.2, 1.57, (side * .624, .041 + layer * .0045, 0), page_edge, .01, True, (12, 4))
        if side == 1:
            edge.rotation_euler.z = math.pi
    top = sheet('Open sketchbook page', notebook, 1.2, 1.57, (side * .624, .09, 0), artwork('Field notes ' + str(side), 'book-left' if side == -1 else 'book-right'), .052, True)
    if side == 1:
        # Mirror the gutter geometry while preserving readable artwork orientation.
        for vertex in top.data.vertices:
            vertex.co.x *= -1
        for face in top.data.polygons:
            for index in face.loop_indices:
                top.data.uv_layers[0].data[index].uv.x = 1 - top.data.uv_layers[0].data[index].uv.x
        import bmesh
        bm = bmesh.new()
        bm.from_mesh(top.data)
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bm.to_mesh(top.data)
        bm.free()
cube('Binding gutter', notebook, (.032, .045, 1.57), (0, .08, 0), cover, .008)

cv = group('cv', 3.35, .912, 1.35, .17)
for index in range(3):
    sheet('CV page', cv, 1.35, 1.75, (.018 * index, .008 + index * .005, .014 * index), artwork('Actual supplied CV ' + str(index), 'cv-page') if index == 2 else paper, .035 if index == 2 else .012)

folder = group('index', -3.53, .94, 1.65, .19)
cube('Folder bottom', folder, (1.88, .012, 1.4), (0, .01, 0), manila, .025)
cube('Folder tab', folder, (.63, .013, .17), (-.47, .011, -.76), manila, .03)
for index in range(4):
    sheet('Dossier paper', folder, 1.72, 1.25, (.008 * index, .025 + index * .004, 0), paper, .015)
sheet('Folder cover', folder, 1.88, 1.28, (0, .055, .045), artwork('Project folder cover', 'folder'), .065)

about = group('about', 3.8, .912, -1.25, -.12)
sheet('Personal postcard', about, 1.32, .93, (0, .01, 0), artwork('Personal postcard artwork', 'postcard'), .035)
twin = group('digital-twin', -4.2, .912, -.2, .12)
sheet('Observability note', twin, 1.05, .95, (0, .012, 0), artwork('Observability note artwork', 'observability'), .05)
prints = group('collection', 1.55, .912, 1.65, -.13)
for index in range(3):
    item = sheet('Website print', prints, 1.25, .87, (index * .025, .006 + index * .006, index * .016), artwork('Website print ' + str(index), 'aloir-web'), .025)
    item.rotation_euler.z = index * .02

# Downloaded CC0 lamp: retain a distinct root and its authored PBR surface detail.
lamp = group('lamp', -4.35, .965, -1.85)
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(CACHE / 'lamp' / 'lamp.gltf'))
imported = [obj for obj in bpy.data.objects if obj not in before]
mesh_objects = [obj for obj in imported if obj.type == 'MESH']
points = [obj.matrix_world @ Vector(corner) for obj in mesh_objects for corner in obj.bound_box]
low = Vector(tuple(min(point[k] for point in points) for k in range(3)))
high = Vector(tuple(max(point[k] for point in points) for k in range(3)))
factor = 2.55 * S / (high.z - low.z)
for obj in imported:
    if obj.parent not in imported:
        obj.parent = lamp
        obj.location = (obj.location - Vector(((high.x + low.x) / 2, (high.y + low.y) / 2, low.z))) * factor
        obj.scale *= factor

# Personal imagery replaces the generic row of decorative books.
for x, y, filename, width, height in [(3.0, 3.2, 'aws-execleaders-aug-2025', 1.1, 1.48), (4.4, 3.05, 'anotida-portrait', .9, 1.2)]:
    cube('Photo print frame', architecture, (width + .15, height + .17, .04), (x, y, -5.44), graphite, .018)
    flat_screen('Personal photograph', architecture, width, height, (x, y, -5.414), artwork('Personal photograph ' + filename, filename))

pen = cylinder('Blue pen', desk, .02, 1.03, (.43, .97, 2.34), material('Blue ink pen', '#315592', .3, .15), 'x')
pen.rotation_euler.z = .35

def light(name, kind, xyz, energy, color, target, size=None):
    data = bpy.data.lights.new(name, kind)
    data.energy = energy
    data.color = linear(color)[:3]
    if kind == 'AREA':
        data.shape = 'DISK'
        data.size = size or 1
    if kind == 'SUN':
        data.angle = math.radians(7)
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = pos(*xyz)
    obj.rotation_euler = (Vector(pos(*target)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    return obj

light('Late afternoon sun', 'SUN', (-7, 8, -10), 2.8, '#ffe2b7', (0, .7, 0))
light('Window bounce', 'AREA', (-6.7, 4, -6), 220, '#ffd4a0', (0, .8, 0), 1.0)
light('Cool room fill', 'AREA', (4, 5, 5), 32, '#c6d7e7', (0, .8, 0), 2.0)
light('Desk lamp pool', 'AREA', (-4.3, 3.0, -1.7), 3, '#ffd19b', (-2, .9, 0), .12)

bpy.ops.object.camera_add(location=pos(6.3, 7.2, 10.2))
camera = bpy.context.object
camera.name = 'Studio camera'
camera.rotation_euler = (Vector(pos(0, 1.05, 0)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.sensor_fit = 'VERTICAL'
camera.data.sensor_height = 32
camera.data.lens = 32 / (2 * math.tan(math.radians(39 / 1.12) / 2))
scene.camera = camera

def meshes(root):
    return [obj for obj in root.children_recursive if obj.type == 'MESH']

def join_root(root):
    items = meshes(root)
    if not items:
        return None
    bpy.ops.object.select_all(action='DESELECT')
    for obj in items:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = items[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = root.name + '-mesh'
    return obj

def bake_bounce(root, resolution):
    obj = join_root(root)
    if not obj:
        return
    # Light-map UVs belong to this root. Do not change a shared prop material.
    for index, mat in enumerate(obj.data.materials):
        obj.data.materials[index] = mat.copy()
    print('STUDIO: bake', root.name, resolution, flush=True)
    bpy.context.view_layer.objects.active = obj
    uv = obj.data.uv_layers.new(name='BounceUV')
    obj.data.uv_layers.active = uv
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.018)
    bpy.ops.object.mode_set(mode='OBJECT')
    image = bpy.data.images.new(root.name + '-bounce', resolution, resolution, alpha=False, float_buffer=True)
    image.filepath_raw = str(ART / (root.name + '-bounce.png'))
    image.file_format = 'PNG'
    for mat in set(obj.data.materials):
        target_node = mat.node_tree.nodes.new('ShaderNodeTexImage')
        target_node.image = image
        mat.node_tree.nodes.active = target_node
    scene.render.bake.use_pass_direct = True
    scene.render.bake.use_pass_indirect = True
    scene.render.bake.use_pass_color = True
    scene.render.bake.margin = 12
    bpy.ops.object.bake(type='DIFFUSE')
    gain = _denoise_module.denoise_lightmap(image, ART / (root.name + '-diffuse.png'))
    BAKE_GAINS[root.name] = gain
    image.save()
    node_group = bpy.data.node_groups.get('glTF Material Output')
    if not node_group:
        node_group = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
        node_group.interface.new_socket(name='Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
    for mat in set(obj.data.materials):
        mat['studio_bounce'] = root.name
        mat['studio_bake_gain'] = gain
        nodes, links = mat.node_tree.nodes, mat.node_tree.links
        uv_node = nodes.new('ShaderNodeUVMap')
        uv_node.uv_map = 'BounceUV'
        tex_node = nodes.new('ShaderNodeTexImage')
        # Reference the second UV set without packing a large irradiance texture
        # into glTF's unrelated occlusion/roughness channels. RGB bake is separate.
        uv_marker = bpy.data.images.get('Studio UV marker')
        if not uv_marker:
            uv_marker = bpy.data.images.new('Studio UV marker', 1, 1, alpha=False)
            uv_marker.pixels = [1, 1, 1, 1]
        tex_node.image = uv_marker
        links.new(uv_node.outputs['UV'], tex_node.inputs['Vector'])
        output_node = nodes.new('ShaderNodeGroup')
        output_node.node_tree = node_group
        links.new(tex_node.outputs['Color'], output_node.inputs['Occlusion'])

# Prevent picked-up props from leaving fixed shadows/occlusion in room light maps.
interactive_roots = [monitor, laptop, phone, notebook, cv, folder, about, twin, prints]
for root in interactive_roots:
    for obj in meshes(root):
        obj.visible_shadow = False
bake_bounce(architecture, 1024)
bake_bounce(desk, 2048)
for root in interactive_roots:
    for obj in meshes(root):
        obj.visible_shadow = True

# Join static materials inside each prop, preserving its outer interactive root.
for root in [monitor, laptop, phone, notebook, cv, folder, about, twin, prints]:
    join_root(root)

bpy.ops.wm.save_as_mainfile(filepath=str(ART / 'on-my-table.blend'))
(ART / 'bake-manifest.json').write_text(json.dumps(BAKE_GAINS))
scene.render.filepath = str(ART / 'studio-reference.png')
bpy.ops.render.render(write_still=True)
bpy.ops.export_scene.gltf(filepath=str(ART / 'studio-source.glb'), export_format='GLB', export_apply=True, export_extras=True, export_lights=False, export_cameras=False, export_animations=False, export_image_format='AUTO')
print('STUDIO: finished', flush=True)
