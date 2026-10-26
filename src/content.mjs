export const person = {
  "name": "Anotida Dzinotyiwei",
  "email": "anodzino@gmail.com",
  "linkedin": "https://www.linkedin.com/in/anotida-dzinotyiwei117a4a2a0",
  "intro": "I build apps, websites, and ideas I want to see exist."
};

export const projects = [
  {
    "slug": "novalens",
    "name": "NovaLens",
    "kind": "AI · Technical exploration",
    "title": "From unidentified parts to a reviewable catalogue.",
    "summary": "NovaLens helps a reviewer move from automotive-part photographs to candidate matches, evidence checks, corrections and catalogue export. I designed and developed the workflow as a practical AI project.",
    "status": "Working review interface · current accuracy unvalidated",
    "role": "Product design, review workflow & recognition integration",
    "steps": [
      "Photograph",
      "Find candidates",
      "Review evidence",
      "Correct & catalogue"
    ],
    "decisions": [
      [
        "Evidence before confidence",
        "The current implementation retrieves candidate evidence with SerpApi Lens and can use OpenRouter for additional reasoning. Neither step verifies the part."
      ],
      [
        "A useful fallback tells the truth",
        "Without configured recognition keys, fields remain blank and marked for review. Provider failures raise an error rather than silently producing mock identification."
      ],
      [
        "A review is part of the product",
        "Field corrections, re-photographing and CSV export connect a candidate result to a usable review workflow."
      ]
    ],
    "challenge": "A visually similar part can still be the wrong part. I approached this by separating candidate evidence from confirmation, preserving review decisions and refusing to invent fitment or OEM numbers.",
    "limit": "The interface and provider paths are present in source. The image above comes from an older mock-provider run, so it cannot establish current matching accuracy. Fitment and live business outcomes remain unverified.",
    "audience": "For people reviewing automotive-part inventories.",
    "outcome": "The source contains a candidate-evidence provider boundary, review controls and catalogue export. Next: evaluate candidate quality against a reviewed reference set.",
    "context": [
      "An automotive-part photograph is a useful starting point, but it is not yet a dependable catalogue entry. A similar-looking part may belong to a different model or year, and a confident answer can hide that uncertainty.",
      "I approached NovaLens as a working process: bring in photographs, gather candidate evidence, inspect the proposed fields, correct them, and turn the reviewed information into something useful outside the AI interface."
    ],
    "contribution": "I designed and developed the application around the reviewer’s task. That includes the recognition-provider boundary, structured catalogue fields, evidence and confidence presentation, field corrections, re-photographing and export controls.",
    "journeyDetails": [
      "Bring a photograph into the batch. Image preparation gives the recognition stage a usable input, while the original remains important for human inspection.",
      "Request candidate information from the configured recognition services. The result is a proposal with evidence and uncertainty, rather than a verified identification.",
      "Inspect make, model, part name, years and visible condition separately. Recheck a field, correct it, or ask for a clearer photograph when the image cannot support a decision.",
      "Use the reviewed information in a catalogue export. Export is the handoff into business work; it does not turn an uncertain candidate into verified fitment."
    ],
    "engineering": [
      [
        "One interface, different recognition paths",
        "A TypeScript VisionClient boundary exposes image tagging and field rechecks. Configuration can select visual-search evidence, model reasoning, or a combined path, without giving each provider a different review interface."
      ],
      [
        "A structured response is easier to challenge",
        "The recognition schema asks for catalogue fields, field confidence and concise field evidence. Values are normalised before use. Scores describe the model’s own output; they are not measured identification accuracy."
      ],
      [
        "Missing configuration is an explicit state",
        "When neither recognition service is configured, the mock leaves fields blank and marks them for review. A configured provider error propagates as an error instead of being replaced with a plausible invented record. Provider calls also have a bounded timeout."
      ]
    ],
    "reflection": "The central lesson is that useful AI needs a good correction path. The interesting design work is in helping someone decide what to trust, what to change and what to leave unresolved.",
    "capabilities": [
      "Structured AI workflows",
      "Human review & uncertainty",
      "Provider integration"
    ]
  },
  {
    "slug": "atlas",
    "name": "Atlas",
    "kind": "VirtuKey · iPhone app",
    "title": "Finding your way inside unfamiliar places.",
    "summary": "An indoor navigation experience bringing destination search, floor context and route presentation into a mobile interface.",
    "status": "Implemented interface · illustrative navigation",
    "role": "Mobile experience, map interaction & illustrative routing",
    "steps": [
      "Search",
      "Choose a floor",
      "See a route",
      "Arrive"
    ],
    "decisions": [
      [
        "Make the destination the starting point",
        "Destination search leads into floor and route context, so the journey begins with the visitor’s intent."
      ],
      [
        "Keep the route in context",
        "Floor selection and a route preview help explain movement through a venue. The current route implementation is explicitly a demo."
      ]
    ],
    "challenge": "A clear route is only one part of indoor navigation. I worked on search, floor selection and route presentation while keeping demo navigation explicit. Native and browser rendering also need separate validation.",
    "limit": "The captured interface contains illustrative route, duration and confidence information. It does not demonstrate accurate on-site positioning, validated arrival behaviour or native-device performance.",
    "audience": "For visitors navigating an unfamiliar indoor place.",
    "outcome": "Search, floor selection and route presentation are implemented. Next: test native-device behaviour and routes with real venue data.",
    "context": [
      "Inside an unfamiliar venue, finding a destination is only the beginning. A visitor also needs to understand the current floor, the next transition and what the route is asking them to do.",
      "Atlas explores that experience on mobile. Search, floor context and route presentation work together, with a schematic venue and demo navigation making the interaction testable before on-site positioning is validated."
    ],
    "contribution": "My work covers the mobile product experience, destination and floor interactions, route presentation and the illustrative routing logic. I kept the difference between a convincing navigation interface and a validated indoor-navigation system explicit.",
    "journeyDetails": [
      "Search for a destination and inspect the result in the context of the venue. The goal is to move from a name to a useful place on the map.",
      "Choose a floor and keep level changes visible. An indoor route needs more context than a line drawn across one flat map.",
      "Preview the route and its floor segments. The demo network includes corridor intersections and connections between levels.",
      "Follow the intended journey through the interface. Position, time, distance and arrival labels in the captures are illustrative rather than field measurements."
    ],
    "engineering": [
      [
        "Routes follow a connected network",
        "The demo builds a graph from corridor paths and splits crossings into connected nodes. Destinations attach to that network instead of receiving a straight line through the building."
      ],
      [
        "Accessibility changes the route",
        "The step-free preference restricts the demo’s inter-floor connections to lifts. The fixture also contains escalators for the ordinary route. These connections and costs are illustrative venue data, not a certified accessibility survey."
      ],
      [
        "A map preview is only one validation layer",
        "The native map and browser fallback have different rendering paths. Search and route behaviour can be inspected in source and captures, but positioning quality and arrival still require a physical device and a real venue."
      ]
    ],
    "reflection": "A route needs to be understandable before it can be useful. The next challenge is pairing that interaction with trustworthy venue information and measured positioning behaviour.",
    "capabilities": [
      "Spatial interaction",
      "Mobile product design",
      "Graph-based demo routing"
    ],
    "gallery": [
      {
        "src": "atlas-search-study.webp",
        "width": 390,
        "height": 844,
        "alt": "Earlier Atlas destination search interface with a sample venue",
        "caption": "Earlier search study using a sample venue. Opening hours and travel labels are illustrative."
      },
      {
        "src": "atlas-navigation-study.webp",
        "width": 390,
        "height": 844,
        "alt": "Earlier Atlas demo journey with floor control and a navigation instruction",
        "caption": "Earlier navigation study. Position and timing labels demonstrate the interface rather than measured venue accuracy."
      }
    ]
  },
  {
    "slug": "digital-twin",
    "name": "Digital Twin",
    "kind": "Systems · High-level overview",
    "title": "Making connected systems easier to understand.",
    "summary": "Systems and data engineering work concerned with how connected information becomes useful operational awareness.",
    "status": "Overview only",
    "role": "Engineering work",
    "steps": [],
    "decisions": [],
    "challenge": "Working across connected systems means considering how different parts contribute to an understandable whole.",
    "limit": "This public overview intentionally excludes implementation details, system internals and actual project content.",
    "audience": "For understanding connected information in a monitoring context.",
    "outcome": "This page is deliberately a broad account of the work. Further system details remain outside the public portfolio."
  },
  {
    "slug": "tradeos",
    "name": "TradeOS",
    "kind": "VirtuKey · Product",
    "title": "Giving complex trade work a clearer structure.",
    "summary": "A VirtuKey product for organising trade-case information and making a complex review easier to follow. My work connects the information model with a structured review interface.",
    "status": "Implemented interface · sample-data mode",
    "role": "Product design, trade-case workflows & application development",
    "steps": [
      "Open a case",
      "Review information",
      "Inspect findings",
      "Record a decision"
    ],
    "decisions": [
      [
        "Keep the case together",
        "Trade-case interfaces organise the material a reviewer needs around a single case."
      ],
      [
        "Separate demonstrations from integrations",
        "The API adapter has distinct sample-data and API paths. A demonstration result is labelled as such and does not establish a deployed integration."
      ]
    ],
    "challenge": "Risk-related interfaces can look authoritative even when the underlying information is only illustrative. Clear provenance and review context matter as much as presentation.",
    "limit": "The local source has sample-data and API request paths. This audit did not verify deployed integrations, live compliance intelligence or real trade outcomes.",
    "audience": "For people reviewing complex trade-case information.",
    "outcome": "Source separates sample-data mode from API requests. Next: validate integration behaviour and review clarity with representative cases.",
    "example": "Sample case: laptops, United States → Germany. Shipment details, document review and risk-review steps come together in one dossier. This example uses seeded demonstration data.",
    "context": [
      "A trade case brings together shipment details, documents, findings and decisions. Spreading those across unrelated screens makes it harder to understand what a reviewer is actually being asked to assess.",
      "TradeOS is my VirtuKey product work around that problem: use a shared case as the organising unit, so the underlying information and the review steps remain connected."
    ],
    "contribution": "I worked across the application’s case model, product interface and review flow. The emphasis is on organising complex information and preserving the context around a decision, while keeping sample outputs visibly separate from connected-service behaviour.",
    "journeyDetails": [
      "Open the example laptop shipment from the United States to Germany. This is a seeded UI example, with no customer or live shipment represented.",
      "Read the shipment and document context together. A reviewer should be able to see what a finding is referring to before acting on it.",
      "Inspect the risk-related and document-review interfaces. The example module outputs are prewritten fixtures, not results of a live compliance service.",
      "Continue through the case’s review flow with the original context available. The portfolio demonstrates the information design; real decisions require verified evidence and integrations."
    ],
    "engineering": [
      [
        "The case is the common object",
        "Trade-case records carry context and module runs together, rather than treating every review output as an unrelated result. That gives the interface a stable place to connect information and the next action."
      ],
      [
        "Sample mode is a deliberate branch",
        "The web API adapter uses seeded records only when mock mode is explicitly enabled. Otherwise it calls the configured API and surfaces request errors. That boundary makes demonstrations possible without presenting them as connected intelligence."
      ],
      [
        "Authority needs provenance",
        "A polished risk label can look more authoritative than its evidence supports. The important interface boundary is keeping the example status, source context and review task visible around the result."
      ]
    ],
    "reflection": "This work combines product design with information modelling. The question is not just how to display a large amount of information, but how to help someone understand the basis for a decision.",
    "capabilities": [
      "Complex information design",
      "Review workflows",
      "Application/API boundaries"
    ]
  },
  {
    "slug": "forma",
    "name": "Forma",
    "kind": "VirtuKey · Product",
    "title": "A clearer view of receivables.",
    "summary": "Forma is a VirtuKey product exploring invoice and receivables workflows. The application connects a financial overview with draft invoice work.",
    "status": "Application interface · seeded sample data",
    "role": "Product design, application development & document workflows",
    "steps": [
      "See the overview",
      "Create a draft",
      "Review invoice details"
    ],
    "decisions": [
      [
        "Connect summary and action",
        "The overview is useful when it helps someone move into the invoice work behind it."
      ],
      [
        "Keep draft work persistent",
        "The application source includes invoice draft persistence and SQLite storage, with an alternative storage adapter."
      ]
    ],
    "challenge": "Financial summaries need clear meaning. The public interface uses seeded companies and invoices so the interaction can be understood without exposing customer records.",
    "limit": "The capture shows actual application UI with seeded sample data. Live settlement, payments and deployment were not tested.",
    "audience": "For people managing invoices and receivables.",
    "outcome": "The application persists draft invoices and supplies a seeded demonstration. Next: validate connected service behaviour beyond local sample data.",
    "context": [
      "An invoice workspace needs to do more than show totals. It needs to help someone move from a financial overview into the document that needs attention, without losing draft work or confusing different document states.",
      "Forma is a VirtuKey product connecting that overview with invoice authoring, customer information and receivables. The public captures use seeded records so the workflow can be examined without exposing real billing activity."
    ],
    "contribution": "I designed and developed the product experience around overview-to-document navigation, invoice drafts and the underlying document data. The work also includes structured parsing, currency handling and persistent draft storage.",
    "journeyDetails": [
      "Start with the financial overview and identify the draft or document that needs attention. The displayed totals belong to sample records.",
      "Open a draft and review the document type, dates, currency, customer and line items. The editor keeps the authoring task and its document preview close together.",
      "Check the document details and totals before advancing its state. A saved draft, a sent document and a paid invoice have different meanings."
    ],
    "engineering": [
      [
        "Money has an explicit representation",
        "The parser converts supported currency amounts to integer minor units. It also records when currency has been defaulted, so omitted context can be surfaced instead of silently treated as certain."
      ],
      [
        "Document states carry meaning",
        "The application defines separate status vocabularies for quotes and invoices. A draft is not interchangeable with a finalized, partially paid or void document, which matters for both the interface and the stored record."
      ],
      [
        "Drafts survive the editing session",
        "The application source includes persisted draft invoices and SQLite storage, with a separate storage adapter available. The portfolio capture demonstrates seeded local data; it does not establish live payment settlement."
      ]
    ],
    "reflection": "For financial software, clarity is part of correctness. A useful overview should lead into a record someone can inspect, and a status should tell the truth about that record.",
    "capabilities": [
      "Document workflow design",
      "Persistent application state",
      "Currency & input modelling"
    ],
    "gallery": [
      {
        "src": "forma-invoice-editor.webp",
        "width": 1440,
        "height": 1000,
        "alt": "Forma invoice editor showing a sample draft and document preview",
        "caption": "Actual invoice-authoring interface with seeded customer and document data. The displayed figures are sample values."
      }
    ]
  },
  {
    "slug": "dala",
    "name": "Dala",
    "kind": "VirtuKey · iPhone app",
    "title": "Exploring a service experience on iPhone.",
    "summary": "Dala is a VirtuKey iPhone application built with SwiftUI. My work includes the app experience, role-based demo state and an API client.",
    "status": "Native app source · device validation pending",
    "role": "SwiftUI product experience & service-client integration",
    "steps": [
      "Discover a service",
      "Inspect a provider",
      "Enter a booking flow",
      "Return to booking details"
    ],
    "decisions": [
      [
        "Make demo state explicit",
        "The application includes dedicated demo-mode and demo-role paths."
      ],
      [
        "Separate local state from services",
        "A URLSession API client provides the service boundary; its presence does not establish backend reachability."
      ]
    ],
    "challenge": "Keeping a useful demonstration separate from a connected application is essential when persistent demo preferences include sample payment methods.",
    "limit": "A genuine public app capture is still being prepared. Backend reachability, activated payments and physical-device behaviour have not been verified in this portfolio audit.",
    "audience": "For people using a mobile service experience.",
    "outcome": "Native app source includes explicit demo roles and a URLSession client. Next: prepare a genuine device capture and verify backend connectivity.",
    "context": [
      "A mobile service experience needs to connect discovery with the work that follows: understanding a provider, making a booking and returning to its details. A set of isolated screens is only part of that journey.",
      "Dala is a VirtuKey iPhone application exploring that connected experience. The native source includes customer-facing views, booking flows, provider and operations views, and explicit demo state."
    ],
    "contribution": "My work includes the SwiftUI app experience, navigation and application state, role-based demonstrations and the URLSession service client. The public story focuses on those implemented boundaries while a genuine device capture is prepared.",
    "journeyDetails": [
      "Browse the available service experience and move toward a relevant provider.",
      "Use the business profile as the point where discovery becomes a more informed choice.",
      "Continue into the implemented booking interface. Demo state and sample payment preferences do not establish an activated transaction.",
      "Return to booking details and the wider application state. End-to-end backend reachability still needs separate verification."
    ],
    "engineering": [
      [
        "The client needs useful error states",
        "The API layer distinguishes session expiry, permission errors, validation, conflicts, offline conditions and timeouts. Those states give the interface more useful recovery options than a single generic failure."
      ],
      [
        "Demo roles are separate from connectivity",
        "Application state includes explicit demo-mode and role paths. That helps demonstrate different experiences, while keeping a seeded local preference separate from a backend-confirmed fact."
      ],
      [
        "SwiftUI and services meet at an explicit boundary",
        "A typed URLSession client handles request and response work. Its presence is evidence of integration code, not proof that every configured endpoint is reachable on a device."
      ]
    ],
    "reflection": "The interesting mobile work sits between screens: preserving context, handling partial failure and making the next action understandable.",
    "capabilities": [
      "Native iPhone interaction",
      "Application state",
      "Network error handling"
    ]
  },
  {
    "slug": "acetech",
    "name": "AceTech eRequisitions",
    "kind": "Business software",
    "title": "Bringing structure to requisitions.",
    "summary": "An electronic requisition application connecting request creation, review and approval with management visibility.",
    "status": "Implemented application · deployment unverified",
    "role": "Application development, requisition rules & reporting",
    "steps": [
      "Create a request",
      "Review & approve",
      "Manage & report"
    ],
    "decisions": [
      [
        "Enforce ownership on the server",
        "The requisition policy checks requester ownership and permits mutation only while the request is a draft."
      ],
      [
        "Support the management view",
        "Reports, statistics and charts complement the request and approval workflow."
      ]
    ],
    "challenge": "A request needs to remain editable at the right stage without allowing changes that undermine review. Server-side draft and ownership rules provide that boundary.",
    "limit": "Source supports requisitions, approvals, attachments and reporting. Live deployment, throughput and business outcomes were not tested. Customer requests and attachments are excluded from this public page.",
    "audience": "For requesters, approvers and managers handling requisitions.",
    "outcome": "Server policies enforce requester ownership and draft-only changes. Next: prepare a sanitised capture and validate the complete approval journey.",
    "context": [
      "A requisition starts as an editable request, but it eventually becomes something another person must review. The application needs to make that transition understandable and protect the reviewed record from inappropriate changes.",
      "AceTech eRequisitions connects request creation, approvals and reporting. My public account describes the workflow and enforcement rules without showing customer requests or attachments."
    ],
    "contribution": "I developed the application’s requisition flow, ownership and draft rules, and management-facing reporting work. The important boundary is between an editable request and a record that other people rely on for review.",
    "journeyDetails": [
      "A requester creates the information needed for a requisition. The server policy restricts creation to the requester role.",
      "The request moves into review and approval work. Ownership and draft state govern whether the requester can still change it.",
      "Management-facing resources provide reports, statistics and charts around the workflow. Live operational outcomes are outside this source audit."
    ],
    "engineering": [
      [
        "Ownership is checked on the server",
        "Update and deletion policies require the requester’s identity to match the record, the requester role to be present and the status to remain DRAFT. The rule therefore exists beyond the screen controls."
      ],
      [
        "Permissions depend on the record’s state",
        "An ownership check alone would still allow a requester to change information after its review context matters. Combining ownership with draft status creates a clearer editing boundary."
      ],
      [
        "Reporting is part of the workflow",
        "Reporting resources sit alongside the request and approval application. They provide a management perspective without needing to reproduce private request content in this portfolio."
      ]
    ],
    "reflection": "Business software becomes more dependable when the permissions mirror the process. The interface explains what can happen; the server must enforce when it can happen.",
    "capabilities": [
      "Business process modelling",
      "Server-side authorization",
      "Management reporting"
    ]
  },
  {
    "slug": "folio",
    "name": "Folio",
    "kind": "Study tools · Web & mobile",
    "title": "From a document to a place to study.",
    "summary": "Document workflows and study tools across web and mobile, with careful boundaries around private information.",
    "status": "Academic project",
    "role": "Sole designer & developer across web and mobile",
    "steps": [
      "Upload a document",
      "Ask questions",
      "Study",
      "Review"
    ],
    "decisions": [
      [
        "Protect document content",
        "Administrative visibility should not expose private documents or questions."
      ],
      [
        "Connect the learning journey",
        "Document questions and study tools are part of one study workflow."
      ]
    ],
    "challenge": "Connecting document handling, study interactions and mobile access while respecting privacy.",
    "limit": "A successful build does not establish live provider or physical-device behaviour.",
    "audience": "For students working with documents and study material.",
    "outcome": "Source implements document workflows and server-only exact-email administrative access with session checks. Next: verify live provider and physical-device behaviour.",
    "context": [
      "Students work with the same source material in different ways: storing it, locating a passage, asking a question and turning it into revision. Folio brings those tasks into a document and study workspace.",
      "I built Folio’s implementation independently within the academic submission context. The product combines a private document vault, source-linked questions, study tools and deadline tracking across a Next.js web application and a Flutter mobile application."
    ],
    "contribution": "I designed and built the web and mobile journeys, document-processing and study-tool implementation, and the server-side privacy boundaries. The group submission context does not change my sole implementation contribution.",
    "journeyDetails": [
      "Upload a document into the workspace and retain its connection to the original source.",
      "Ask a document question with page-aware extracted text available to support the response.",
      "Move into study work such as notes and quiz setup, keeping the selected source in context.",
      "Use the generated material for revision and check explanations against the source. Generation is a study aid, not an automatic guarantee of correctness."
    ],
    "engineering": [
      [
        "Page context survives extraction",
        "Document text is represented with page numbers rather than only as one unstructured string. The page-handling code validates ordering and bounds, allowing later interactions to retain a source reference."
      ],
      [
        "A quiz needs more than an answer key",
        "The generation schema requests choices, a correct index, an explanation and supporting evidence. That structure makes a question easier to inspect and connect back to the supplied material."
      ],
      [
        "Administrative access has a narrow purpose",
        "The admin API uses server-side exact-email authorization and explicit response columns. Documents, prompts, answers, source content and token hashes are excluded from those administrative responses."
      ]
    ],
    "reflection": "Connecting the study journey and protecting its source material are related design problems. A useful workspace should reduce friction without making private content broadly visible.",
    "capabilities": [
      "Web/mobile product delivery",
      "Document & study workflows",
      "Privacy boundaries"
    ]
  },
  {
    "slug": "laas",
    "name": "Laas",
    "kind": "AI · Technical exploration",
    "title": "What can football video really tell us?",
    "summary": "A video analysis exploration for understanding what can and cannot be recovered from ordinary football footage. It produces detections, temporary tracks and image-space diagnostics for review.",
    "status": "Local research pipeline · unreviewed outputs",
    "role": "Video pipeline, review experience & evidence handling",
    "steps": [
      "Upload a clip",
      "Detect objects",
      "Track over time",
      "Review uncertainty"
    ],
    "decisions": [
      [
        "Preserve unknowns",
        "Missing visibility and uncertain identity must remain unknown rather than become invented match events."
      ],
      [
        "Keep coordinates in context",
        "Image-pixel positions describe the video frame. They do not establish measured positions on the pitch."
      ],
      [
        "Separate detection from interpretation",
        "A temporary track is not verified player identity, and a detection is not an approved football event."
      ]
    ],
    "challenge": "The hardest stretches are the ones where the ball disappears, the camera changes or an identity cannot be maintained. I approached these by keeping uncertain output explicit and making review necessary.",
    "limit": "A local YOLO and ByteTrack run produced real sampled detections and temporary tracks. Player identity, event classification and performance analytics remain unvalidated.",
    "audience": "For exploring football-video analysis with human review.",
    "outcome": "The local pipeline produced actual sampled detections and temporary tracks. Next: review track quality and improve known coverage before interpreting events.",
    "context": [
      "Football video makes a compelling promise: turn an ordinary clip into something a coach or analyst can inspect. The difficult part is separating what the camera and model actually observed from what someone hopes the system understands.",
      "Laas explores that boundary through real video uploads, object detection, temporary tracks and human review. The current evidence supports local observations and image-space diagnostics; it does not establish reliable full-match performance analysis."
    ],
    "contribution": "I developed the upload-to-analysis workflow, processing integration, review and export experience, and the handling of uncertain observations. I use existing detection and tracking models; the portfolio does not claim that I trained those upstream models.",
    "journeyDetails": [
      "Upload a decodable clip and create a processing job. Capability and media checks surface missing models or unsupported input instead of inventing a result.",
      "Run object detection against sampled source frames. An observation is tied to its source time and image coordinates.",
      "Associate detections into temporary tracks and inspect the annotated output. Cuts and occlusion can split tracks or switch identities.",
      "Review supported evidence, keep unknown periods explicit and export the resulting artifacts. Football-event interpretation needs stronger evidence and human review."
    ],
    "engineering": [
      [
        "Recovery is explicit",
        "Jobs persist their queued and running state. After interruption they can restart from the saved source, and a failed job can be retried. This is restart recovery, not frame-level checkpointing."
      ],
      [
        "Coordinates need a reference frame",
        "Image-pixel positions are useful for reviewing video, but they do not establish real pitch distance or speed. Physical measurements require source-specific calibration and a suitable camera."
      ],
      [
        "Detection and interpretation have separate evidence",
        "The pipeline produces annotated video and timestamped JSON observations. Temporary track IDs and confidence values remain unreviewed model output; event statistics need approved annotations or additional validation."
      ]
    ],
    "reflection": "The most important output is sometimes an honest unknown. Preserving those gaps makes the research more useful than filling an attractive dashboard with unsupported match statistics.",
    "capabilities": [
      "Computer-vision integration",
      "Asynchronous processing",
      "Evidence-led review"
    ]
  }
];
