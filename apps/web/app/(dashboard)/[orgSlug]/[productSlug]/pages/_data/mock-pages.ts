export interface SectionDef {
  id: string
  type: string
  order: number
  content: Record<string, any>
}

export interface PageDef {
  id: string
  name: string
  slug: string
  status: 'draft' | 'published'
  parentId: string | null
  order: number
  sections: SectionDef[]
  seo: { title: string; description: string }
}

export const SECTION_TYPES = [
  'Hero',
  'Features',
  'Content',
  'CTA',
  'Testimonials',
  'Pricing',
  'FAQ',
  'Gallery',
  'Stats',
  'Footer',
  'Custom',
] as const

export type SectionType = (typeof SECTION_TYPES)[number]

// R20: section-type palette — identity tints tied to page section kinds.
// Analogous to NODE_KIND_COLORS on the graph surface, this is domain
// reference data (not studio chrome) and belongs to its own palette-
// centralization phase. Left literal and eslint-disabled line-by-line.
export const SECTION_COLORS: Record<string, string> = {
  // eslint-disable-next-line no-hardcoded-hex -- section-palette: Hero
  Hero: '#8B5CF6',
  // eslint-disable-next-line no-hardcoded-hex -- section-palette: Features
  Features: '#3B82F6',
  // eslint-disable-next-line no-hardcoded-hex -- section-palette: Content
  Content: '#94A3B8',
  // eslint-disable-next-line no-hardcoded-hex -- section-palette: CTA
  CTA: '#10B981',
  // eslint-disable-next-line no-hardcoded-hex -- section-palette: Testimonials
  Testimonials: '#EC4899',
  // eslint-disable-next-line no-hardcoded-hex -- section-palette: Pricing
  Pricing: '#F59E0B',
  // eslint-disable-next-line no-hardcoded-hex -- section-palette: FAQ
  FAQ: '#06B6D4',
  // eslint-disable-next-line no-hardcoded-hex -- section-palette: Gallery
  Gallery: '#F97316',
  // eslint-disable-next-line no-hardcoded-hex -- section-palette: Stats
  Stats: '#6366F1',
  // eslint-disable-next-line no-hardcoded-hex -- section-palette: Footer
  Footer: '#64748B',
  // eslint-disable-next-line no-hardcoded-hex -- section-palette: Custom (fallback)
  Custom: '#64748B',
}

export const mockPages: PageDef[] = [
  {
    id: 'page-home',
    name: 'Home',
    slug: '/',
    status: 'published',
    parentId: null,
    order: 0,
    sections: [
      {
        id: 'sec-home-hero',
        type: 'Hero',
        order: 0,
        content: {
          heading: 'Build products faster with Product OS',
          subheading:
            'The unified product intelligence and execution platform for modern teams.',
          ctaText: 'Get Started',
          ctaLink: '/pricing',
          background: true,
        },
      },
      {
        id: 'sec-home-features',
        type: 'Features',
        order: 1,
        content: {
          features: [
            {
              icon: 'Zap',
              title: 'Lightning Fast',
              description: 'Ship features in hours, not weeks.',
            },
            {
              icon: 'Shield',
              title: 'Enterprise Ready',
              description: 'SOC 2 compliant with role-based access.',
            },
            {
              icon: 'BarChart3',
              title: 'Analytics Built In',
              description: 'Track every metric that matters.',
            },
            {
              icon: 'Sparkles',
              title: 'AI Powered',
              description: 'Let AI handle the repetitive work.',
            },
          ],
        },
      },
      {
        id: 'sec-home-stats',
        type: 'Stats',
        order: 2,
        content: {
          title: 'Trusted by teams worldwide',
          description: 'Numbers that speak for themselves.',
        },
      },
      {
        id: 'sec-home-cta',
        type: 'CTA',
        order: 3,
        content: {
          heading: 'Ready to get started?',
          description:
            'Join thousands of teams already building with Product OS.',
          buttonText: 'Start Free Trial',
          buttonLink: '/signup',
        },
      },
    ],
    seo: {
      title: 'Product OS - Build Products Faster',
      description:
        'The unified product intelligence and execution platform for modern teams.',
    },
  },
  {
    id: 'page-about',
    name: 'About',
    slug: '/about',
    status: 'published',
    parentId: null,
    order: 1,
    sections: [
      {
        id: 'sec-about-content',
        type: 'Content',
        order: 0,
        content: {
          text: 'Product OS was born from the frustration of switching between dozens of tools to build a single product. We believe product teams deserve a unified platform that connects every aspect of product development.',
          image: false,
        },
      },
      {
        id: 'sec-about-gallery',
        type: 'Gallery',
        order: 1,
        content: {
          title: 'Our Team',
          description: 'Meet the people behind Product OS.',
        },
      },
    ],
    seo: {
      title: 'About - Product OS',
      description: 'Learn about the team and mission behind Product OS.',
    },
  },
  {
    id: 'page-pricing',
    name: 'Pricing',
    slug: '/pricing',
    status: 'published',
    parentId: null,
    order: 2,
    sections: [
      {
        id: 'sec-pricing-hero',
        type: 'Hero',
        order: 0,
        content: {
          heading: 'Simple, transparent pricing',
          subheading: 'Start free. Scale as you grow.',
          ctaText: 'Compare Plans',
          ctaLink: '#plans',
          background: false,
        },
      },
      {
        id: 'sec-pricing-plans',
        type: 'Pricing',
        order: 1,
        content: {
          plans: [
            {
              name: 'Starter',
              price: '$0/mo',
              features: ['5 projects', '3 team members', 'Basic analytics'],
            },
            {
              name: 'Pro',
              price: '$29/mo',
              features: [
                'Unlimited projects',
                '25 team members',
                'Advanced analytics',
                'AI features',
              ],
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              features: [
                'Everything in Pro',
                'Unlimited team members',
                'SSO & SAML',
                'Dedicated support',
              ],
            },
          ],
        },
      },
      {
        id: 'sec-pricing-faq',
        type: 'FAQ',
        order: 2,
        content: {
          title: 'Frequently Asked Questions',
          description: 'Answers to common questions about our pricing.',
        },
      },
      {
        id: 'sec-pricing-cta',
        type: 'CTA',
        order: 3,
        content: {
          heading: 'Still have questions?',
          description: 'Talk to our sales team for a custom quote.',
          buttonText: 'Contact Sales',
          buttonLink: '/contact',
        },
      },
    ],
    seo: {
      title: 'Pricing - Product OS',
      description: 'Simple, transparent pricing for teams of all sizes.',
    },
  },
  {
    id: 'page-blog',
    name: 'Blog',
    slug: '/blog',
    status: 'draft',
    parentId: null,
    order: 3,
    sections: [
      {
        id: 'sec-blog-content',
        type: 'Content',
        order: 0,
        content: {
          text: 'Stay up to date with the latest news, feature releases, and product insights from the Product OS team.',
          image: false,
        },
      },
    ],
    seo: {
      title: 'Blog - Product OS',
      description: 'Latest news and insights from the Product OS team.',
    },
  },
  {
    id: 'page-contact',
    name: 'Contact',
    slug: '/contact',
    status: 'published',
    parentId: null,
    order: 4,
    sections: [
      {
        id: 'sec-contact-content',
        type: 'Content',
        order: 0,
        content: {
          text: 'We would love to hear from you. Fill out the form below or email us at hello@product-os.io.',
          image: false,
        },
      },
      {
        id: 'sec-contact-cta',
        type: 'CTA',
        order: 1,
        content: {
          heading: 'Get in touch',
          description: 'Our team typically responds within 24 hours.',
          buttonText: 'Send Message',
          buttonLink: '#',
        },
      },
    ],
    seo: {
      title: 'Contact - Product OS',
      description: 'Get in touch with the Product OS team.',
    },
  },
  {
    id: 'page-docs',
    name: 'Docs',
    slug: '/docs',
    status: 'published',
    parentId: null,
    order: 5,
    sections: [
      {
        id: 'sec-docs-content',
        type: 'Content',
        order: 0,
        content: {
          text: 'Welcome to Product OS documentation. Choose a topic below to get started.',
          image: false,
        },
      },
    ],
    seo: {
      title: 'Documentation - Product OS',
      description: 'Complete documentation for Product OS.',
    },
  },
  {
    id: 'page-docs-getting-started',
    name: 'Getting Started',
    slug: '/docs/getting-started',
    status: 'published',
    parentId: 'page-docs',
    order: 0,
    sections: [
      {
        id: 'sec-gs-content',
        type: 'Content',
        order: 0,
        content: {
          text: 'This guide will walk you through setting up your first product in Product OS. Follow along step by step.',
          image: false,
        },
      },
    ],
    seo: {
      title: 'Getting Started - Product OS Docs',
      description: 'Learn how to set up Product OS for your team.',
    },
  },
  {
    id: 'page-docs-api-reference',
    name: 'API Reference',
    slug: '/docs/api-reference',
    status: 'draft',
    parentId: 'page-docs',
    order: 1,
    sections: [
      {
        id: 'sec-api-content',
        type: 'Content',
        order: 0,
        content: {
          text: 'Complete API reference for Product OS. Includes authentication, endpoints, and example requests.',
          image: false,
        },
      },
    ],
    seo: {
      title: 'API Reference - Product OS Docs',
      description: 'Complete API reference for the Product OS platform.',
    },
  },
]
