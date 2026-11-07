import type { Product } from '@/types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    slug: 'aether-01-headphones',
    sku: 'NR-01-AET',
    modelNumber: 'NR-01 // AETHER',
    name: 'Aether 01 Planar Headphones',
    subtitle: 'Active Acoustic Reference Over-Ear Instrument',
    shortDescription:
      'CNC-milled anodized aluminum earcups housing 50mm planar magnetic transducers, hybrid adaptive silence, and full-grain lambskin acoustic cushions.',
    editorialDescription:
      'Conceived in our Zurich acoustic laboratory, the Aether 01 bridges the chasm between studio reference planar headphones and nomadic wireless instruments. Each earcup is carved from solid 6061-T6 aluminum and paired with a tensioned stainless-steel headband wrapped in breathable lambskin.',
    category: 'audio',
    categoryName: 'Acoustic Instruments',
    collectionIds: ['col-monolith', 'col-acoustic'],
    price: 890,
    compareAtPrice: 980,
    currency: 'USD',
    stockStatus: 'in_stock',
    inventoryCount: 28,
    badge: 'new_release',
    badgeLabel: 'Edition 04 // Flagship',
    featured: true,
    isSpotlight: true,
    isNewArrival: true,
    releaseYear: 2026,
    designedIn: 'Zurich & Tokyo',
    primaryImage:
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1400&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      {
        id: 'gal-01-1',
        url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1400&q=85',
        alt: 'Aether 01 Planar Headphones in Matte Obsidian',
        caption: 'Fig 01. Bead-blasted 6061-T6 aluminum acoustic housing.',
      },
      {
        id: 'gal-01-2',
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=85',
        alt: 'Aether 01 profile silhouette',
        caption: 'Fig 02. Precision stainless-steel torsion yoke with stepless slide.',
      },
      {
        id: 'gal-01-3',
        url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1400&q=85',
        alt: 'Aether 01 studio acoustic detail',
        caption: 'Fig 03. Magnetic memory-foam cushions upholstered in full-grain leather.',
      },
      {
        id: 'gal-01-4',
        url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1400&q=85',
        alt: 'Aether 01 Raw Titanium colorway',
        caption: 'Fig 04. Raw Anodized Titanium finish.',
      },
    ],
    colors: [
      {
        id: 'col-obsidian',
        name: 'Obsidian',
        hex: '#161615',
        finish: 'Type III Hard-Anodized Matte Carbon',
        image:
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'OBS',
      },
      {
        id: 'col-titanium',
        name: 'Raw Titanium',
        hex: '#ABA79E',
        finish: 'Glass-Bead Blasted Natural Alloy',
        image:
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'TIT',
      },
      {
        id: 'col-bronze',
        name: 'Warm Bronze',
        hex: '#7D6856',
        finish: 'Brushed Architectural Bronze',
        image:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'BRZ',
      },
    ],
    optionGroupLabel: 'Configuration',
    options: [
      {
        id: 'opt-standard',
        label: 'Standard Edition',
        value: 'standard',
        priceDelta: 0,
        inStock: true,
      },
      {
        id: 'opt-mastering',
        label: 'Mastering Edition (+ 4.4mm Pentaconn Silver Cable)',
        value: 'mastering',
        priceDelta: 140,
        inStock: true,
      },
    ],
    materials: [
      'CNC-Milled 6061-T6 Aerospace Aluminum',
      'PVD-Coated 316L Stainless Steel Yokes',
      'Full-Grain Lambskin & Acoustic Memory Foam',
      '2-Micron Ultra-Thin Planar Magnetic Diaphragm',
    ],
    highlights: [
      '50mm Planar Magnetic Transducers (5 Hz – 50,000 Hz)',
      '48 Hours Continuous Playback with Adaptive Chamber ANC',
      'Lossless USB-C 32-bit/384kHz Internal DAC + aptX Lossless',
      'Modular Magnetic Ear Cushions & Replaceable Battery Cell',
    ],
    specifications: [
      {
        group: 'Acoustics & Electronics',
        label: 'Transducer Principle',
        value: '50mm Custom Planar Magnetic with Neodymium N55 Array',
      },
      {
        group: 'Acoustics & Electronics',
        label: 'Frequency Response',
        value: '5 Hz – 50,000 Hz (+/- 1.5 dB Acoustic Reference Curve)',
      },
      {
        group: 'Acoustics & Electronics',
        label: 'Total Harmonic Distortion',
        value: '< 0.04% @ 1 kHz, 100 dB SPL',
      },
      {
        group: 'Acoustics & Electronics',
        label: 'Active Noise Cancellation',
        value: '8-Microphone Hybrid Phase-Coherent ANC (-44 dB)',
      },
      {
        group: 'Architecture & Materials',
        label: 'Chassis Construction',
        value: '5-Axis CNC-Machined 6061-T6 Aluminum, Type III Anodized',
      },
      {
        group: 'Dimensions & Weight',
        label: 'Mass',
        value: '365 g (excluding cable)',
      },
      {
        group: 'Connectivity & Power',
        label: 'Battery Autonomy',
        value: '48 Hours (ANC Active) / 64 Hours (ANC Off)',
      },
      {
        group: 'Connectivity & Power',
        label: 'Wired Interfaces',
        value: 'USB-C Lossless DAC (32-bit/384kHz) & 3.5mm Balanced TRS',
      },
      {
        group: 'In The Box',
        label: 'Included Accessories',
        value: 'Molded Wool Travel Case, 1.5m Braided USB-C DAC Cable, 3.5mm TRS Reference Lead, Calibration Certificate',
      },
    ],
    storyBlocks: [
      {
        id: 'sb-01',
        eyebrow: '01 // ACOUSTIC TRANSPARENCY',
        title: 'Two-Micron Planar Velocity',
        description:
          'Unlike conventional dynamic cones that flex at high excursions, the Aether 01 utilizes an ultra-light 2-micron diaphragm suspended between symmetric N55 magnet arrays—delivering instantaneous transient response.',
        image:
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1400&q=85',
        imageAlt: 'Aether 01 transducer engineering',
        caption: 'Calibrated individually in our Zurich anechoic chamber.',
        layout: 'split-left',
        metrics: [
          { label: 'Diaphragm Thickness', value: '2.0', unit: 'μm' },
          { label: 'Harmonic Distortion', value: '<0.04', unit: '%' },
          { label: 'Frequency Ceiling', value: '50', unit: 'kHz' },
        ],
      },
      {
        id: 'sb-02',
        eyebrow: '02 // ENGINEERED LONGEVITY',
        title: 'Built to Be Serviced, Never Discarded',
        description:
          'Every structural component—from the magnetic lambskin ear cushions to the internal lithium-silicon power cell—is fastened with precision Torx hardware rather than permanent adhesives.',
        image:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=85',
        imageAlt: 'Aether 01 modular construction',
        caption: '10-year parts availability guarantee on all NR-01 serial numbers.',
        layout: 'split-right',
      },
    ],
    faqs: [
      {
        question: 'Can the Aether 01 be used completely passively without battery power?',
        answer:
          'Yes. When connected via the included 3.5mm OFC braided cable or optional 4.4mm balanced Pentaconn cable, the planar transducers operate directly from your external amplifier with zero battery consumption.',
      },
      {
        question: 'How is the battery serviced after years of daily use?',
        answer:
          'Removing four micro-Torx screws beneath the left magnetic ear cushion grants direct access to the plug-and-play battery module. Replacement cells can be ordered directly from NOIRÉ.',
      },
    ],
    shippingEstimate: 'Ships within 1–2 business days after payment confirmation. Free express shipping on orders over $500.',
    warrantyYears: 5,
    relatedProductIds: ['prod-02', 'prod-11', 'prod-04'],
    status: 'active',
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-09-25T14:30:00Z',
  },
  {
    id: 'prod-02',
    slug: 'monolith-one-acoustic-sculpture',
    sku: 'NR-02-MON',
    modelNumber: 'NR-02 // MONOLITH',
    name: 'Monolith One Spatial Speaker',
    subtitle: '360° Omnidirectional Architectural Loudspeaker',
    shortDescription:
      'Milled from a 14kg solid aluminum forging. Delivers 420W of room-calibrated spatial acoustics with zero cabinet resonance.',
    editorialDescription:
      'The Monolith One rejects the plastic box paradigm of wireless audio. Standing as a quiet architectural column in aluminum and acoustic wool, it projects a three-dimensional soundstage that adapts automatically to room geometry.',
    category: 'audio',
    categoryName: 'Acoustic Instruments',
    collectionIds: ['col-monolith', 'col-acoustic'],
    price: 1650,
    currency: 'USD',
    stockStatus: 'low_stock',
    inventoryCount: 5,
    badge: 'limited_edition',
    badgeLabel: 'Numbered Batch // 250 Units',
    featured: true,
    isSpotlight: false,
    isNewArrival: true,
    releaseYear: 2026,
    designedIn: 'Zurich',
    primaryImage:
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1400&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      {
        id: 'gal-02-1',
        url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1400&q=85',
        alt: 'Monolith One Spatial Speaker front view',
        caption: 'Fig 01. Dispersion acoustic lens machined to 0.01mm concentricity.',
      },
      {
        id: 'gal-02-2',
        url: 'https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1400&q=85',
        alt: 'Monolith One top rotary dial',
        caption: 'Fig 02. Illuminated glass & weighted aluminum crown.',
      },
    ],
    colors: [
      {
        id: 'col-obsidian-02',
        name: 'Obsidian',
        hex: '#141413',
        finish: 'Bead-Blasted Matte Carbon',
        image:
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'OBS',
      },
      {
        id: 'col-raw-alum-02',
        name: 'Natural Billet',
        hex: '#B8B5AD',
        finish: 'Raw Clear-Anodized 6061',
        image:
          'https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'ALU',
      },
    ],
    materials: [
      'Solid Forged 6061-T6 Aluminum Unibody',
      'Kvadrat Acoustic Merino Textile',
      'Gorilla Glass Matte Capacitive Crown',
    ],
    highlights: [
      '420W Tri-Amplified Class-D Architecture',
      'Active Room Boundary & Reflection Compensation',
      'AirPlay 2, Tidal Connect, Roon Ready, Phono RCA & Optical',
    ],
    specifications: [
      {
        group: 'Acoustics & Electronics',
        label: 'Amplification',
        value: '420W Total (1x 220W Woofer, 2x 100W Mid/Tweeter Arrays)',
      },
      {
        group: 'Acoustics & Electronics',
        label: 'Frequency Range',
        value: '28 Hz – 38,000 Hz (-3 dB)',
      },
      {
        group: 'Architecture & Materials',
        label: 'Enclosure Construction',
        value: '5-Axis Milled Solid 6061-T6 Forging with Internal Sinusoidal Ribs',
      },
      {
        group: 'Dimensions & Weight',
        label: 'Dimensions & Mass',
        value: '210 × 210 × 340 mm // 8.4 kg',
      },
      {
        group: 'Connectivity & Power',
        label: 'Streaming & Inputs',
        value: 'Wi-Fi 6E, Ethernet, Bluetooth 5.3 aptX Adaptive, RCA Phono, HDMI eARC',
      },
    ],
    storyBlocks: [
      {
        id: 'sb-02-1',
        eyebrow: '01 // SOLID BILLET UNIBODY',
        title: 'Zero Panel Flex at 108 Decibels',
        description:
          'Milled over four hours from a single aluminum block, the Monolith One eliminates cabinet coloration entirely.',
        image:
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1400&q=85',
        imageAlt: 'Monolith One unibody',
        layout: 'split-left',
        metrics: [
          { label: 'Billet Mass', value: '14.0', unit: 'kg' },
          { label: 'Peak Output', value: '108', unit: 'dB' },
          { label: 'Bass Extension', value: '28', unit: 'Hz' },
        ],
      },
    ],
    faqs: [
      {
        question: 'Can two Monolith One units be paired as a phase-coherent stereo system?',
        answer:
          'Yes. Using ultra-wideband wireless sync or Ethernet link, two units automatically lock within 1.5 microseconds of phase accuracy.',
      },
      {
        question: 'Does the built-in phono stage support moving-magnet turntables?',
        answer:
          'Yes. The gold-plated RCA input includes a switchable studio-grade RIAA phono preamplifier as well as a pure line-level bypass.',
      },
    ],
    shippingEstimate: 'Ships within 1–2 business days after payment confirmation. Free express shipping on orders over $500.',
    warrantyYears: 5,
    relatedProductIds: ['prod-01', 'prod-03', 'prod-11'],
    status: 'active',
    createdAt: '2026-07-15T10:00:00Z',
    updatedAt: '2026-09-20T12:00:00Z',
  },
  {
    id: 'prod-03',
    slug: 'solis-cantilever-lamp',
    sku: 'NR-03-SOL',
    modelNumber: 'NR-03 // SOLIS',
    name: 'Solis Cantilever Task Luminaire',
    subtitle: 'Counterbalanced CRI 98+ Optical Desk Instrument',
    shortDescription:
      'Precision counterbalanced cantilever lamp with stepless rotary dimming, circadian warmth shift (2400K–5600K), and anti-glare borosilicate optics.',
    editorialDescription:
      'Solis treats light as an architectural building block. Suspended by a frictionless brass counterweight gimbal, the slender aluminum light bar floats effortlessly above drafting tables and studio monitors.',
    category: 'lighting',
    categoryName: 'Architectural Lighting',
    collectionIds: ['col-monolith', 'col-architectural-desk'],
    price: 640,
    currency: 'USD',
    stockStatus: 'in_stock',
    inventoryCount: 19,
    badge: 'award_winner',
    badgeLabel: 'Red Dot // Best of Best',
    featured: true,
    isSpotlight: false,
    isNewArrival: false,
    releaseYear: 2026,
    designedIn: 'Zurich',
    primaryImage:
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1400&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      {
        id: 'gal-03-1',
        url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1400&q=85',
        alt: 'Solis Cantilever Task Luminaire',
        caption: 'Fig 01. Counterbalanced cantilever geometry.',
      },
      {
        id: 'gal-03-2',
        url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1400&q=85',
        alt: 'Solis warm light pool',
        caption: 'Fig 02. Micro-prismatic borosilicate optical waveguide.',
      },
    ],
    colors: [
      {
        id: 'col-obsidian-03',
        name: 'Obsidian',
        hex: '#141413',
        finish: 'Matte Anodized Carbon',
        image:
          'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'OBS',
      },
      {
        id: 'col-bronze-03',
        name: 'Aged Brass',
        hex: '#8C735B',
        finish: 'Hand-Brushed Architectural Bronze',
        image:
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'BRS',
      },
    ],
    materials: [
      'Extruded & CNC-Turned 6061 Aluminum',
      'Optical Borosilicate Micro-Prism Diffuser',
      '3.2kg Cast Iron & Brass Base Anchor',
    ],
    highlights: [
      'Museum-Grade CRI 98.4 / R9 > 96 Spectral Accuracy',
      'Stepless Dual-Ring Rotary Encoder for Lux & Kelvin',
      'Ambient Radar Presence Sensor for Automatic Wake/Sleep',
    ],
    specifications: [
      {
        group: 'Acoustics & Electronics',
        label: 'Color Rendering Index',
        value: 'CRI 98.4 (R9 > 96 Full-Spectrum SunLike LED Array)',
      },
      {
        group: 'Acoustics & Electronics',
        label: 'Color Temperature Range',
        value: '2,400K (Candlelight) – 5,600K (North Daylight)',
      },
      {
        group: 'Dimensions & Weight',
        label: 'Reach & Height',
        value: '780mm Horizontal Span × 540mm Vertical Clearance // 4.1 kg',
      },
      {
        group: 'Connectivity & Power',
        label: 'Power Delivery',
        value: 'Braided 2.4m Fabric Cable + Integrated 45W USB-C Base Passthrough Port',
      },
    ],
    storyBlocks: [
      {
        id: 'sb-03-1',
        eyebrow: '01 // CIRCADIAN PRECISION',
        title: 'Zero Screen Glare. Zero Flicker.',
        description:
          'Engineered with an asymmetric optical cut-off, Solis floods your desk in 1,200 lux of high-CRI illumination without casting a single reflection onto studio displays.',
        image:
          'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1400&q=85',
        imageAlt: 'Solis desk illumination',
        layout: 'split-left',
        metrics: [
          { label: 'Spectral Accuracy', value: '98.4', unit: 'CRI' },
          { label: 'Peak Illuminance', value: '1,200', unit: 'Lux' },
          { label: 'Rated Lifespan', value: '65k', unit: 'Hrs' },
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the rated lifespan of the optical LED array?',
        answer:
          'The passive aluminum heatsink chassis maintains junction temperatures below 48°C, yielding an L90 lifespan exceeding 65,000 hours.',
      },
      {
        question: 'Can the base be replaced with a desk-edge clamp?',
        answer:
          'Yes. Every Solis unit includes both the 3.2kg freestanding architectural base and a CNC-milled billet C-clamp for desks up to 65mm thick.',
      },
    ],
    shippingEstimate: 'Ships within 1–2 business days after payment confirmation. Free express shipping on orders over $500.',
    warrantyYears: 5,
    relatedProductIds: ['prod-04', 'prod-05', 'prod-09'],
    status: 'active',
    createdAt: '2026-06-12T10:00:00Z',
    updatedAt: '2026-09-18T10:00:00Z',
  },
  {
    id: 'prod-04',
    slug: 'kinetic-65-field-keyboard',
    sku: 'NR-04-KIN',
    modelNumber: 'NR-04 // KINETIC-65',
    name: 'Kinetic-65 Mechanical Instrument',
    subtitle: 'Gasket-Mounted Machined Aluminum & Brass Keyboard',
    shortDescription:
      'A 2.6kg solid billet mechanical typing instrument with custom Hall-effect magnetic switches, brass acoustic weight, and precision rotary encoder.',
    editorialDescription:
      'Designed for writers, engineers, and architects who spend ten hours a day in dialogue with text. The Kinetic-65 isolates its internal switch plate on sixteen silicone poron gaskets, producing a deep, muted marimba-like acoustic profile.',
    category: 'tactile-input',
    categoryName: 'Tactile Input',
    collectionIds: ['col-monolith', 'col-architectural-desk'],
    price: 520,
    compareAtPrice: 580,
    currency: 'USD',
    stockStatus: 'in_stock',
    inventoryCount: 34,
    badge: 'bestseller',
    badgeLabel: 'Signature Instrument',
    featured: true,
    isSpotlight: false,
    isNewArrival: false,
    releaseYear: 2026,
    designedIn: 'Tokyo',
    primaryImage:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1400&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      {
        id: 'gal-04-1',
        url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1400&q=85',
        alt: 'Kinetic-65 Mechanical Keyboard top view',
        caption: 'Fig 01. Double-shot PBT keycaps with micro-textured matte surface.',
      },
      {
        id: 'gal-04-2',
        url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1400&q=85',
        alt: 'Kinetic-65 switch and keycap profile',
        caption: 'Fig 02. Custom lubricated tactile and linear switch options.',
      },
    ],
    colors: [
      {
        id: 'col-obsidian-04',
        name: 'Obsidian / Slate',
        hex: '#191918',
        finish: 'Anodized Carbon with PVD Black Brass Weight',
        image:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'OBS',
      },
      {
        id: 'col-stone-04',
        name: 'Alabaster / Raw Brass',
        hex: '#E6E3DC',
        finish: 'Electrophoretic Warm Stone with Sandblasted Brass',
        image:
          'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'ALB',
      },
    ],
    optionGroupLabel: 'Switch Calibration',
    options: [
      {
        id: 'opt-linear',
        label: 'NOIRÉ Graphite Linear (45g Factory Hand-Lubed)',
        value: 'linear-45g',
        priceDelta: 0,
        inStock: true,
      },
      {
        id: 'opt-tactile',
        label: 'NOIRÉ Bronze Tactile (55g Crisp Leaf)',
        value: 'tactile-55g',
        priceDelta: 20,
        inStock: true,
      },
    ],
    materials: [
      '6063 Architectural Aluminum Case',
      '980g CuZn39Pb3 Through-Body Brass Acoustic Weight',
      '1.5mm Thick Double-Shot PBT Keycaps',
    ],
    highlights: [
      'Isolated Poron Gasket Mount Architecture',
      '72-Detent Magnetic Hall-Effect Rotary Encoder',
      'Tri-Mode: Low-Latency 2.4GHz, Bluetooth 5.3 & Braided USB-C',
      'Full QMK / VIA Open-Source Firmware Programmability',
    ],
    specifications: [
      {
        group: 'Architecture & Materials',
        label: 'Typing Angle & Front Height',
        value: '6.5° Ergonomic Inclination // 17.8 mm Front Lip',
      },
      {
        group: 'Dimensions & Weight',
        label: 'Dimensions & Mass',
        value: '318 × 114 × 32 mm // 2,620 g Fully Assembled',
      },
      {
        group: 'Connectivity & Power',
        label: 'Battery Capacity',
        value: '6,000 mAh Dual Cell (Up to 5 Months Wireless Autonomy)',
      },
      {
        group: 'In The Box',
        label: 'Included Kit',
        value: 'Kinetic-65 Instrument, Coiled LEMO-Style USB-C Cable, Switch Puller, macOS & Windows Keycap Accents',
      },
    ],
    storyBlocks: [
      {
        id: 'sb-04-1',
        eyebrow: '01 // ACOUSTIC ENGINEERING',
        title: '2.6 Kilograms of Unyielding Mass',
        description:
          'A solid brass through-weight anchors the Kinetic-65 to your desk, absorbing high-frequency metallic ping and leaving only a crisp, low-register acoustic signature.',
        image:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1400&q=85',
        imageAlt: 'Kinetic-65 brass weight',
        layout: 'split-left',
        metrics: [
          { label: 'Total Mass', value: '2.62', unit: 'kg' },
          { label: 'Rotary Detents', value: '72', unit: '/rev' },
          { label: 'Polling Rate', value: '1,000', unit: 'Hz' },
        ],
      },
    ],
    faqs: [
      {
        question: 'Are the switches hot-swappable without soldering?',
        answer:
          'Yes. The PCB features gold-plated Kailh hot-swap sockets supporting all 3-pin and 5-pin MX-style mechanical switches.',
      },
      {
        question: 'Is Kinetic-65 compatible with both macOS and Windows out of the box?',
        answer:
          'Yes. A recessed hardware toggle on the rear bezel switches instantly between macOS and Windows/Linux keymaps, and both Command/Option and Win/Alt keycaps are included.',
      },
    ],
    shippingEstimate: 'Ships within 1–2 business days after payment confirmation. Free express shipping on orders over $500.',
    warrantyYears: 3,
    relatedProductIds: ['prod-05', 'prod-10', 'prod-03'],
    status: 'active',
    createdAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-09-12T10:00:00Z',
  },
  {
    id: 'prod-05',
    slug: 'plinth-desk-system',
    sku: 'NR-05-PLN',
    modelNumber: 'NR-05 // PLINTH',
    name: 'Plinth Modular Desk Shelf',
    subtitle: 'Architectural Display Riser & Magnetic Organization System',
    shortDescription:
      'Spanning 116cm in oiled European walnut and extruded aluminum, with an integrated magnetic rail and hidden valet drawer.',
    editorialDescription:
      'The Plinth creates a second architectural horizon across your desk. Below its cantilevered deck, laptops, audio interfaces, and keyboards store cleanly out of sight while studio monitors sit at true ergonomic eye level.',
    category: 'desk-architecture',
    categoryName: 'Desk Architecture',
    collectionIds: ['col-architectural-desk'],
    price: 390,
    currency: 'USD',
    stockStatus: 'in_stock',
    inventoryCount: 42,
    featured: true,
    isNewArrival: false,
    releaseYear: 2026,
    designedIn: 'Zurich',
    primaryImage:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      {
        id: 'gal-05-1',
        url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=85',
        alt: 'Plinth Modular Desk Shelf on architectural desk',
        caption: 'Fig 01. Cantilevered aluminum legs with cork dampening pads.',
      },
      {
        id: 'gal-05-2',
        url: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1400&q=85',
        alt: 'Minimalist workspace detail',
        caption: 'Fig 02. Felt-lined magnetic valet tray beneath the main span.',
      },
    ],
    colors: [
      {
        id: 'col-obsidian-oak',
        name: 'Smoked Oak & Obsidian',
        hex: '#23201D',
        finish: 'Kiln-Smoked European Oak + Black Anodized Steel',
        image:
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'OAK',
      },
      {
        id: 'col-walnut-titanium',
        name: 'American Walnut & Titanium',
        hex: '#594233',
        finish: 'Hand-Oiled Solid Walnut + Raw Anodized Aluminum',
        image:
          'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'WAL',
      },
    ],
    materials: [
      '22mm Solid FSC-Certified Hardwood Plank',
      '5mm Bent & Bead-Blasted Aluminum Uprights',
      'German Merino Wool Felt Drawer Liner',
    ],
    highlights: [
      'Supports up to 45kg (Dual Studio Displays or Pro Display XDR)',
      'Integrated Neodymium Cable Routing Channel',
      'Concealed Smooth-Glide Valet Drawer for Notebooks & Styluses',
    ],
    specifications: [
      {
        group: 'Dimensions & Weight',
        label: 'External Dimensions',
        value: '1,160 × 240 × 112 mm // 5.8 kg',
      },
      {
        group: 'Architecture & Materials',
        label: 'Load Capacity',
        value: '45 kg Static Load (Zero Central Deflection)',
      },
      {
        group: 'In The Box',
        label: 'Hardware Included',
        value: 'Plinth Deck, 2x Anodized Uprights, Wool Valet Tray, CNC Hex Driver',
      },
    ],
    storyBlocks: [
      {
        id: 'sb-05-1',
        eyebrow: '01 // SPATIAL ORDER',
        title: 'Two Levels of Architectural Calm',
        description:
          'By elevating displays to natural optical height and creating a shadowed sanctuary below for input instruments, Plinth restores visual stillness to the studio table.',
        image:
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=85',
        imageAlt: 'Plinth Modular Desk Shelf',
        layout: 'split-left',
      },
    ],
    faqs: [
      {
        question: 'Does the Plinth require tools to assemble?',
        answer:
          'Everything required is included in the box, including a custom CNC-turned hex driver and four stainless steel M6 fasteners.',
      },
      {
        question: 'Will a 16-inch MacBook Pro fit inside the lower recess?',
        answer:
          'Yes. The central span offers 780mm of horizontal clearance and 74mm of vertical clearance beneath the valet drawer.',
      },
    ],
    shippingEstimate: 'Ships within 1–2 business days after payment confirmation. Free express shipping on orders over $500.',
    warrantyYears: 10,
    relatedProductIds: ['prod-04', 'prod-03', 'prod-12'],
    status: 'active',
    createdAt: '2026-04-11T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'prod-06',
    slug: 'chronos-e-ink-horology',
    sku: 'NR-06-CHR',
    modelNumber: 'NR-06 // CHRONOS',
    name: 'Chronos E-Ink Environmental Clock',
    subtitle: 'Silent Ambient Horology & Air Quality Instrument',
    shortDescription:
      'High-contrast Carta 1300 E-Ink display framed in brushed titanium. Monitors CO2, barometric pressure, humidity, and time in complete silence.',
    editorialDescription:
      'Chronos replaces glowing bedside and studio screens with the calm permanence of ink on paper. Updated once per minute with zero blue-light emission, it also tracks indoor CO2 and VOC levels using Swiss Sensirion sensors.',
    category: 'smart-instruments',
    categoryName: 'Smart Instruments',
    collectionIds: ['col-transit'],
    price: 340,
    currency: 'USD',
    stockStatus: 'in_stock',
    inventoryCount: 22,
    badge: 'new_release',
    badgeLabel: 'New Instrument',
    featured: true,
    isNewArrival: true,
    releaseYear: 2026,
    designedIn: 'Zurich',
    primaryImage:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      {
        id: 'gal-06-1',
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=85',
        alt: 'Chronos E-Ink Instrument',
        caption: 'Fig 01. Anti-glare etched mineral glass over 300 PPI E-Ink.',
      },
      {
        id: 'gal-06-2',
        url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1400&q=85',
        alt: 'Chronos profile detail',
        caption: 'Fig 02. Grade 5 Titanium bezel.',
      },
    ],
    colors: [
      {
        id: 'col-titanium-06',
        name: 'Raw Titanium',
        hex: '#A6A29A',
        finish: 'Brushed Grade 5 Titanium',
        image:
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'TIT',
      },
      {
        id: 'col-obsidian-06',
        name: 'Obsidian',
        hex: '#141413',
        finish: 'DLC Coated Matte Carbon',
        image:
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'OBS',
      },
    ],
    materials: [
      'Grade 5 Titanium Unibody Frame',
      'Micro-Etched Anti-Glare Sapphire Crystal',
      'Swiss Sensirion NDIR CO2 & Barometric Array',
    ],
    highlights: [
      '300 PPI Carta 1300 E-Ink Display (Zero Blue Light)',
      '9-Month Battery Life per Single USB-C Charge',
      'Precision Atomic NTP Time Sync + Acoustic Chime Alarm',
    ],
    specifications: [
      {
        group: 'Acoustics & Electronics',
        label: 'Display Panel',
        value: '5.8" E-Ink Carta 1300 (300 PPI, Paper-White Reflectance)',
      },
      {
        group: 'Acoustics & Electronics',
        label: 'Environmental Telemetry',
        value: 'True NDIR CO2 (400–5,000 ppm), Temperature (±0.1°C), Relative Humidity',
      },
      {
        group: 'Dimensions & Weight',
        label: 'Dimensions & Mass',
        value: '142 × 96 × 28 mm // 480 g',
      },
    ],
    storyBlocks: [
      {
        id: 'sb-06-1',
        eyebrow: '01 // CALM COMPUTING',
        title: 'Information Without Illumination',
        description:
          'Chronos reflects ambient room light just like archival rag paper. At night, a warm 2000K edge-lit waveguide activates only when your hand approaches within 15 centimeters.',
        image:
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1400&q=85',
        imageAlt: 'Chronos E-Ink Clock',
        layout: 'split-left',
      },
    ],
    faqs: [
      {
        question: 'Does Chronos require a smartphone app or subscription?',
        answer:
          'Never. All environmental graphs and horology layouts can be configured directly via the rear brass crown, with optional Wi-Fi NTP atomic time synchronization.',
      },
    ],
    shippingEstimate: 'Ships within 1–2 business days after payment confirmation. Free express shipping on orders over $500.',
    warrantyYears: 3,
    relatedProductIds: ['prod-03', 'prod-05', 'prod-07'],
    status: 'active',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-09-19T10:00:00Z',
  },
  {
    id: 'prod-07',
    slug: 'nomad-solid-state-power-core',
    sku: 'NR-07-NOM',
    modelNumber: 'NR-07 // NOMAD-20K',
    name: 'Nomad 140W Solid-State Power Core',
    subtitle: 'Anodized Aluminum 20,000mAh Telemetry Power Instrument',
    shortDescription:
      'Airline-compliant 20,000mAh solid-state battery encased in ribbed aluminum with dual 140W USB-C PD 3.1 ports and monochrome OLED wattage telemetry.',
    editorialDescription:
      'Engineered for field production and intercontinental transit, the Nomad 20K delivers sustained 140W output capable of fast-charging a 16-inch workstation and mirrorless camera simultaneously without thermal throttling.',
    category: 'travel-carry',
    categoryName: 'Travel & Everyday Carry',
    collectionIds: ['col-transit'],
    price: 220,
    currency: 'USD',
    stockStatus: 'in_stock',
    inventoryCount: 65,
    featured: false,
    isNewArrival: true,
    releaseYear: 2026,
    designedIn: 'Tokyo',
    primaryImage:
      'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1400&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      {
        id: 'gal-07-1',
        url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1400&q=85',
        alt: 'Nomad 140W Solid-State Power Core',
        caption: 'Fig 01. Extruded heat-dissipating ribbed chassis.',
      },
      {
        id: 'gal-07-2',
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1400&q=85',
        alt: 'Nomad field kit',
        caption: 'Fig 02. Designed for seamless integration with Folio-16.',
      },
    ],
    colors: [
      {
        id: 'col-obsidian-07',
        name: 'Obsidian',
        hex: '#141413',
        finish: 'Hard-Anodized Ribbed Carbon',
        image:
          'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'OBS',
      },
      {
        id: 'col-titanium-07',
        name: 'Titanium',
        hex: '#9E9A90',
        finish: 'Natural Bead-Blasted Alloy',
        image:
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'TIT',
      },
    ],
    materials: [
      'CNC-Extruded 6063 Thermal Aluminum Shell',
      'Semi-Solid-State High-Density Lithium Cells (1,200 Cycles)',
    ],
    highlights: [
      '140W Bidirectional USB-C PD 3.1 (Recharges 0–80% in 28 Minutes)',
      'Real-Time Per-Port Voltage, Amperage & Thermal Telemetry',
      'TSA / EASA 74Wh Cabin Carry-On Compliant',
    ],
    specifications: [
      {
        group: 'Connectivity & Power',
        label: 'Capacity & Output',
        value: '20,000 mAh (74 Wh) // 140W Max Single-Port PD 3.1',
      },
      {
        group: 'Dimensions & Weight',
        label: 'Dimensions & Mass',
        value: '148 × 52 × 26 mm // 390 g',
      },
    ],
    storyBlocks: [
      {
        id: 'sb-07-1',
        eyebrow: '01 // SOLID-STATE ELECTROCHEMISTRY',
        title: '1,200 Charge Cycles Without Capacity Fade',
        description:
          'By replacing volatile liquid electrolytes with a semi-solid polymer matrix, Nomad-20K delivers triple the cycle longevity and superior thermal stability at 140 watts.',
        image:
          'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1400&q=85',
        imageAlt: 'Nomad 140W Power Core',
        layout: 'split-left',
      },
    ],
    faqs: [
      {
        question: 'Is the Nomad-20K permitted in commercial aircraft cabin luggage?',
        answer:
          'Yes. Rated at 74 Watt-hours, it sits well below the 100Wh FAA, TSA, and EASA international carry-on limit.',
      },
    ],
    shippingEstimate: 'Ships within 1–2 business days after payment confirmation. Free express shipping on orders over $500.',
    warrantyYears: 3,
    relatedProductIds: ['prod-08', 'prod-01', 'prod-06'],
    status: 'active',
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z',
  },
  {
    id: 'prod-08',
    slug: 'folio-16-ballistic-architect-brief',
    sku: 'NR-08-FOL',
    modelNumber: 'NR-08 // FOLIO-16',
    name: 'Folio-16 Technical Architect Brief',
    subtitle: 'Dyneema Composite & Vegetable-Tanned Bridle Leather Sleeve',
    shortDescription:
      'Waterproof magnetic laptop and instrument folio crafted from woven Dyneema and Italian vegetable-tanned leather with FIDLOCK hardware.',
    editorialDescription:
      'Designed to house a 16-inch workstation, iPad Pro, and field cables in a razor-thin profile. Magnetic FIDLOCK V-buckles snap shut automatically on approach and release with a single finger pull.',
    category: 'travel-carry',
    categoryName: 'Travel & Everyday Carry',
    collectionIds: ['col-transit'],
    price: 295,
    currency: 'USD',
    stockStatus: 'in_stock',
    inventoryCount: 18,
    badge: 'archival',
    badgeLabel: 'Permanent Collection',
    featured: false,
    isNewArrival: false,
    releaseYear: 2026,
    designedIn: 'Zurich & Milan',
    primaryImage:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1400&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      {
        id: 'gal-08-1',
        url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1400&q=85',
        alt: 'Folio-16 Technical Architect Brief',
        caption: 'Fig 01. Weatherproof Dyneema and Italian leather trim.',
      },
      {
        id: 'gal-08-2',
        url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1400&q=85',
        alt: 'Folio-16 magnetic hardware detail',
        caption: 'Fig 02. German FIDLOCK magnetic closure.',
      },
    ],
    colors: [
      {
        id: 'col-obsidian-08',
        name: 'Obsidian Carbon',
        hex: '#171716',
        finish: 'Matte Black Dyneema + Tuscan Bridle Leather',
        image:
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'OBS',
      },
    ],
    materials: [
      '5.0 oz Woven Dyneema Composite Laminate',
      'Full-Grain Vegetable-Tanned Tuscan Leather',
      'German FIDLOCK Magnetic Stainless Hardware',
    ],
    highlights: [
      'Fits 14" and 16" Workstations + Dedicated Stylus Channel',
      'YKK AquaGuard Urethane-Coated Weatherproof Zippers',
      'Micro-Suede Scratch-Free Suspension Lining',
    ],
    specifications: [
      {
        group: 'Dimensions & Weight',
        label: 'Dimensions & Mass',
        value: '385 × 272 × 24 mm // 410 g',
      },
      {
        group: 'Architecture & Materials',
        label: 'Water Resistance',
        value: 'IPX6 Hydrostatic Head (20,000mm Laminate Membrane)',
      },
    ],
    storyBlocks: [
      {
        id: 'sb-08-1',
        eyebrow: '01 // TENSILE PERMANENCE',
        title: 'Fifteen Times Stronger Than Steel by Weight',
        description:
          'Woven Dyneema composite provides extraordinary tear and puncture resistance while weighing less than a hardcover monograph.',
        image:
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1400&q=85',
        imageAlt: 'Folio-16 material detail',
        layout: 'split-left',
      },
    ],
    faqs: [
      {
        question: 'Does Folio-16 accommodate a 16-inch MacBook Pro alongside an iPad?',
        answer:
          'Yes. The dual-chamber interior features a suspended micro-suede divider separating your primary workstation from a 13-inch tablet or A4 architectural pad.',
      },
    ],
    shippingEstimate: 'Ships within 1–2 business days after payment confirmation. Free express shipping on orders over $500.',
    warrantyYears: 5,
    relatedProductIds: ['prod-07', 'prod-01', 'prod-11'],
    status: 'active',
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'prod-09',
    slug: 'halo-ambient-monolith-lamp',
    sku: 'NR-09-HAL',
    modelNumber: 'NR-09 // HALO',
    name: 'Halo Ambient Light Sculpture',
    subtitle: 'Alabaster Stone & Anodized Bronze Table Luminaire',
    shortDescription:
      'Carved from natural Spanish alabaster stone over a weighted bronze base. Emits a warm 2200K–3000K architectural glow with touch-capacitive dimming.',
    editorialDescription:
      'Each Halo luminaire features a unique translucent cylinder of natural Spanish alabaster, revealing organic geological veining when illuminated from within.',
    category: 'lighting',
    categoryName: 'Architectural Lighting',
    collectionIds: ['col-architectural-desk'],
    price: 460,
    currency: 'USD',
    stockStatus: 'in_stock',
    inventoryCount: 14,
    featured: false,
    isNewArrival: true,
    releaseYear: 2026,
    designedIn: 'Zurich',
    primaryImage:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1400&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      {
        id: 'gal-09-1',
        url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1400&q=85',
        alt: 'Halo Ambient Light Sculpture',
        caption: 'Fig 01. Hand-turned Spanish alabaster diffuser.',
      },
      {
        id: 'gal-09-2',
        url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1400&q=85',
        alt: 'Halo warm illumination',
        caption: 'Fig 02. Brushed bronze plinth with capacitive touch ring.',
      },
    ],
    colors: [
      {
        id: 'col-bronze-09',
        name: 'Warm Alabaster / Bronze',
        hex: '#8C735B',
        finish: 'Natural Veined Stone + Brushed Bronze Plinth',
        image:
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'BRZ',
      },
    ],
    materials: [
      'Solid Turned Spanish Alabaster Stone',
      'Brushed Architectural Bronze Plinth',
    ],
    highlights: [
      'Cordless 36-Hour Operation or Continuous USB-C Power',
      'Warm-Dimming 1800K–3000K Filament LED Core',
    ],
    specifications: [
      {
        group: 'Dimensions & Weight',
        label: 'Dimensions & Mass',
        value: 'Ø 118 × 245 mm // 2.9 kg',
      },
      {
        group: 'Connectivity & Power',
        label: 'Battery & Charging',
        value: '8,800 mAh Internal Cell // Magnetic Charging Coaster Included',
      },
    ],
    storyBlocks: [
      {
        id: 'sb-09-1',
        eyebrow: '01 // GEOLOGICAL SINGULARITY',
        title: 'No Two Stones Share the Same Veining',
        description:
          'Quarried in Zaragoza, Spain, each alabaster monolith is lathe-turned to a wall thickness of 6.5 millimeters—thick enough to feel substantial, translucent enough to glow like ember.',
        image:
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1400&q=85',
        imageAlt: 'Halo Alabaster stone detail',
        layout: 'split-left',
      },
    ],
    faqs: [
      {
        question: 'Can Halo remain plugged in permanently on a bookshelf or desk?',
        answer:
          'Yes. An intelligent battery management circuit bypasses the cell once reaches 80% in stationary mode to preserve battery health indefinitely.',
      },
    ],
    shippingEstimate: 'Ships within 1–2 business days after payment confirmation. Free express shipping on orders over $500.',
    warrantyYears: 5,
    relatedProductIds: ['prod-03', 'prod-05'],
    status: 'active',
    createdAt: '2026-07-22T10:00:00Z',
    updatedAt: '2026-09-14T10:00:00Z',
  },
  {
    id: 'prod-10',
    slug: 'orbit-rotary-macro-controller',
    sku: 'NR-10-ORB',
    modelNumber: 'NR-10 // ORBIT',
    name: 'Orbit Precision Rotary Controller',
    subtitle: 'Weighted Stainless Steel Dial & Macro Instrument',
    shortDescription:
      'Machined from 316L stainless steel with dual-mode electromagnetic haptic detents for timeline scrubbing, color grading, and studio gain control.',
    editorialDescription:
      'Orbit brings physical weight to digital manipulation. An electromagnetic stator inside the 640g stainless steel puck switches dynamically between free-spinning inertia mode and 18/36/72 ratchet detents per revolution.',
    category: 'tactile-input',
    categoryName: 'Tactile Input',
    collectionIds: ['col-architectural-desk'],
    price: 260,
    currency: 'USD',
    stockStatus: 'in_stock',
    inventoryCount: 31,
    featured: false,
    isNewArrival: false,
    releaseYear: 2026,
    designedIn: 'Tokyo',
    primaryImage:
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1400&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      {
        id: 'gal-10-1',
        url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1400&q=85',
        alt: 'Orbit Precision Rotary Controller',
        caption: 'Fig 01. Micro-knurled 316L stainless steel outer ring.',
      },
      {
        id: 'gal-10-2',
        url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1400&q=85',
        alt: 'Orbit paired with Kinetic-65',
        caption: 'Fig 02. Seamless companion to the Kinetic-65.',
      },
    ],
    colors: [
      {
        id: 'col-steel-10',
        name: 'Raw Stainless',
        hex: '#B5B2AA',
        finish: 'Machined 316L Surgical Steel',
        image:
          'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'STL',
      },
      {
        id: 'col-obsidian-10',
        name: 'PVD Obsidian',
        hex: '#161615',
        finish: 'Diamond-Like Carbon Coated Steel',
        image:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'OBS',
      },
    ],
    materials: [
      '316L Surgical Stainless Steel',
      'Dual Japanese NMB Ceramic Ball Bearings',
      'High-Friction Micro-Suction Base Pad',
    ],
    highlights: [
      'Software-Controlled Electromagnetic Haptic Detents',
      '0.05° Optical Angular Resolution',
      'Native Profiles for DaVinci Resolve, Lightroom, Figma & Logic Pro',
    ],
    specifications: [
      {
        group: 'Dimensions & Weight',
        label: 'Dimensions & Mass',
        value: 'Ø 74 × 31 mm // 640 g',
      },
      {
        group: 'Acoustics & Electronics',
        label: 'Encoder Sensor',
        value: '3,600 CPR Optical Quadrature + Brushless Haptic Motor',
      },
    ],
    storyBlocks: [
      {
        id: 'sb-10-1',
        eyebrow: '01 // PROGRAMMABLE PHYSICS',
        title: 'From Stepless Inertia to 72-Step Ratchet in 1 Millisecond',
        description:
          'Because Orbit uses magnetic field resistance rather than mechanical pawls, its detents adapt automatically to the active application window.',
        image:
          'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1400&q=85',
        imageAlt: 'Orbit Rotary Controller',
        layout: 'split-left',
      },
    ],
    faqs: [
      {
        question: 'Does Orbit work wirelessly as well as over USB-C?',
        answer:
          'Yes. Orbit supports both ultra-low-latency Bluetooth 5.3 LE and direct braided USB-C connection.',
      },
    ],
    shippingEstimate: 'Ships within 1–2 business days after payment confirmation. Free express shipping on orders over $500.',
    warrantyYears: 3,
    relatedProductIds: ['prod-04', 'prod-05'],
    status: 'active',
    createdAt: '2026-05-02T10:00:00Z',
    updatedAt: '2026-09-05T10:00:00Z',
  },
  {
    id: 'prod-11',
    slug: 'resonance-iem-monitors',
    sku: 'NR-11-RES',
    modelNumber: 'NR-11 // RESONANCE',
    name: 'Resonance Titanium In-Ear Monitors',
    subtitle: 'Tri-Brid Electrostatic & Beryllium Reference IEMs',
    shortDescription:
      '3D-sintered Grade 5 titanium shells housing a 10mm beryllium dynamic woofer, four balanced armatures, and dual Sonion electrostatic tweeters.',
    editorialDescription:
      'Designed for audiophiles and touring musicians who demand studio reference accuracy in a pocketable form. Each shell is laser-sintered from titanium powder and hand-finished to a satin luster.',
    category: 'audio',
    categoryName: 'Acoustic Instruments',
    collectionIds: ['col-acoustic', 'col-transit'],
    price: 740,
    currency: 'USD',
    stockStatus: 'pre_order',
    inventoryCount: 0,
    badge: 'limited_edition',
    badgeLabel: 'Batch 03 Allocation',
    featured: false,
    isNewArrival: true,
    releaseYear: 2026,
    designedIn: 'Zurich',
    primaryImage:
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1400&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      {
        id: 'gal-11-1',
        url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1400&q=85',
        alt: 'Resonance Titanium In-Ear Monitors',
        caption: 'Fig 01. Sintered Grade 5 titanium acoustic chambers.',
      },
      {
        id: 'gal-11-2',
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=85',
        alt: 'Resonance acoustic detail',
        caption: 'Fig 02. 8-core monocrystalline silver-plated OCC cable.',
      },
    ],
    colors: [
      {
        id: 'col-titanium-11',
        name: 'Satin Titanium',
        hex: '#9E9A90',
        finish: 'Hand-Brushed Grade 5 Titanium',
        image:
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'TIT',
      },
    ],
    materials: [
      'Selective Laser-Melted Grade 5 Titanium Shells',
      '8-Core Monocrystalline Silver-Plated OCC Copper Cable',
    ],
    highlights: [
      '7-Driver Tri-Brid Acoustic Architecture per Ear',
      '4-Way Passive Crossover with CNC-Bored Acoustic Tubes',
      'Modular Termination System (3.5mm, 4.4mm Balanced & USB-C DAC)',
    ],
    specifications: [
      {
        group: 'Acoustics & Electronics',
        label: 'Impedance & Sensitivity',
        value: '18 Ω @ 1 kHz // 107 dB/mW',
      },
      {
        group: 'Acoustics & Electronics',
        label: 'Driver Complement',
        value: '1x 10mm Beryllium DD, 4x Knowles BA, 2x Sonion EST',
      },
    ],
    storyBlocks: [
      {
        id: 'sb-11-1',
        eyebrow: '01 // TRI-BRID COHERENCE',
        title: 'Seven Transducers in a Single Titanium Monocoque',
        description:
          'By 3D-sintering the internal acoustic waveguides directly into the titanium shell, Resonance achieves phase alignment across all seven drivers without fragile plastic sound tubes.',
        image:
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1400&q=85',
        imageAlt: 'Resonance Titanium IEMs',
        layout: 'split-left',
      },
    ],
    faqs: [
      {
        question: 'What ear tip sizes and materials are included?',
        answer:
          'Each serialized pelican-style aluminum puck includes 6 pairs of medical-grade liquid silicone tips and 3 pairs of acoustic memory-foam tips.',
      },
    ],
    shippingEstimate: 'Pre-order: ships when the batch is released. Free express shipping on orders over $500.',
    warrantyYears: 5,
    relatedProductIds: ['prod-01', 'prod-02'],
    status: 'active',
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-09-28T10:00:00Z',
  },
  {
    id: 'prod-12',
    slug: 'obelisk-weighted-cable-anchor',
    sku: 'NR-12-OBL',
    modelNumber: 'NR-12 // OBELISK',
    name: 'Obelisk Magnetic Cable Anchor Set',
    subtitle: 'Machined Brass & Tungsten Desk Weights (Set of 3)',
    shortDescription:
      'Three precision-knurled magnetic cable blocks milled from solid brass with micro-suction bases that keep charging and audio cables exactly where placed.',
    editorialDescription:
      'Small architectural details define the serenity of a workspace. Each Obelisk anchor weighs 240 grams and features a self-aligning neodymium cap that accommodates braided cables up to 6.5mm in diameter.',
    category: 'desk-architecture',
    categoryName: 'Desk Architecture',
    collectionIds: ['col-architectural-desk'],
    price: 115,
    currency: 'USD',
    stockStatus: 'in_stock',
    inventoryCount: 85,
    featured: false,
    isNewArrival: false,
    releaseYear: 2026,
    designedIn: 'Tokyo',
    primaryImage:
      'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1400&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=85',
    gallery: [
      {
        id: 'gal-12-1',
        url: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1400&q=85',
        alt: 'Obelisk Magnetic Cable Anchor Set',
        caption: 'Fig 01. Diamond-knurled solid brass.',
      },
      {
        id: 'gal-12-2',
        url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=85',
        alt: 'Obelisk on studio desk',
        caption: 'Fig 02. Self-aligning N52 neodymium cap.',
      },
    ],
    colors: [
      {
        id: 'col-obsidian-12',
        name: 'PVD Obsidian',
        hex: '#141413',
        finish: 'PVD Coated Solid Brass',
        image:
          'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'OBS',
      },
      {
        id: 'col-brass-12',
        name: 'Raw Machined Brass',
        hex: '#9E825C',
        finish: 'Uncoated C36000 Architectural Brass',
        image:
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1400&q=85',
        secondaryImage:
          'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1400&q=85',
        inStock: true,
        skuSuffix: 'BRS',
      },
    ],
    materials: [
      'Solid C36000 Free-Machining Brass',
      'N52 Neodymium Self-Aligning Magnetic Cap',
    ],
    highlights: [
      'Set of 3 Anchors in Custom Fitted Wool Felt Presentation Case',
      'Washable Japanese Micro-Suction Base (Zero Adhesive Residue)',
    ],
    specifications: [
      {
        group: 'Dimensions & Weight',
        label: 'Dimensions & Mass',
        value: 'Ø 32 × 28 mm // 240 g per Anchor (720 g Set)',
      },
    ],
    storyBlocks: [
      {
        id: 'sb-12-1',
        eyebrow: '01 // MICRO-ARCHITECTURAL WEIGHT',
        title: '240 Grams of Solid Turned Brass',
        description:
          'Machined on Swiss screw lathes with a tactile diamond knurl, Obelisk keeps heavy braided studio and charging cables anchored without adhesives or clamps.',
        image:
          'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1400&q=85',
        imageAlt: 'Obelisk Cable Anchor',
        layout: 'split-left',
      },
    ],
    faqs: [
      {
        question: 'How do I restore the grip of the micro-suction base if it gathers dust?',
        answer:
          'Simply wipe the base with a damp lint-free cloth and allow it to air dry for two minutes; the microscopic suction cells will regain 100% of their original holding force.',
      },
    ],
    shippingEstimate: 'Ships within 1–2 business days after payment confirmation. Free express shipping on orders over $500.',
    warrantyYears: 10,
    relatedProductIds: ['prod-05', 'prod-04', 'prod-03'],
    status: 'active',
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-08-30T10:00:00Z',
  },
];
