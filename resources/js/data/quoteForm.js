/** Shared options for the corporate quote request form. */
export const REQUIREMENT_TYPES = [
    'New Laptops',
    'Refurbished Laptops',
    'Desktop Computers',
    'Gaming Laptops',
    'Workstations',
    'Networking Equipment',
    'Managed IT Services',
    'Annual Maintenance Contract (AMC)',
    'Corporate IT Procurement',
    'Other',
];

export const PREFERRED_BRANDS = [
    'Dell', 'HP', 'Lenovo', 'Apple', 'ASUS', 'Acer',
    'Cisco', 'MikroTik', 'Ubiquiti', 'TP-Link', 'Other',
];

export const BUDGET_RANGES = [
    'Under PKR 50,000',
    'PKR 50,000 – 100,000',
    'PKR 100,000 – 200,000',
    'PKR 200,000+',
    'Prefer to Discuss',
];

export const NETWORKING_OPTIONS = [
    'Routers',
    'Managed Switches',
    'Wireless Access Points',
    'Network Racks',
    'Structured Cabling',
    'Patch Panels',
    'Firewalls',
    'VPN Configuration',
    'Network Deployment',
    'Network Maintenance',
    'Other',
];

export const SERVICE_OPTIONS = [
    'On-Site Support',
    'Remote Support',
    'Preventive Maintenance',
    'IT Consultation',
    'Network Setup',
    'Server Installation',
    'Security Solutions',
    'Cloud Support',
    'Annual Maintenance Contract (AMC)',
];

export const CONTACT_METHODS = ['Phone Call', 'WhatsApp', 'Email'];

export const IT_SERVICE_TYPES = [
    'Managed IT Services',
    'Annual Maintenance Contract (AMC)',
    'Corporate IT Procurement',
];

export function showsNetworking(requirementType) {
    return requirementType === 'Networking Equipment';
}

export function showsServices(requirementType) {
    return IT_SERVICE_TYPES.includes(requirementType);
}

export const emptyQuoteForm = () => ({
    company_name: '',
    contact_person: '',
    designation: '',
    email: '',
    phone: '',
    website: '',
    business_address: '',
    requirement_type: '',
    preferred_brands: [],
    quantity: '',
    preferred_specs: '',
    budget_range: '',
    networking_requirements: [],
    service_requirements: [],
    project_details: '',
    delivery_city: '',
    expected_delivery_date: '',
    preferred_contact: '',
    declaration: false,
    attachments: [],
});
