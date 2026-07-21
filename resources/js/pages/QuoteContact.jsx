import { CheckCircle2, Mail, MapPin, MessageCircle, Phone, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api, messageFrom, toFormData } from '../api/client';
import { useStore } from '../contexts/StoreContext';
import {
    BUDGET_RANGES,
    CONTACT_METHODS,
    NETWORKING_OPTIONS,
    PREFERRED_BRANDS,
    REQUIREMENT_TYPES,
    SERVICE_OPTIONS,
    emptyQuoteForm,
    showsNetworking,
    showsServices,
} from '../data/quoteForm';
import { PAKISTAN_CITIES } from '../data/shipping';

export function Contact() {
    const { settings = {} } = useStore();
    const [form, setForm] = useState(emptyQuoteForm);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const networkingVisible = showsNetworking(form.requirement_type);
    const servicesVisible = showsServices(form.requirement_type);
    const attachmentNames = useMemo(
        () => (Array.isArray(form.attachments) ? form.attachments : []).map((f) => f.name).join(', '),
        [form.attachments],
    );

    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const toggleList = (key, value) => {
        setForm((current) => {
            const list = current[key] || [];
            return {
                ...current,
                [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value],
            };
        });
    };

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const payload = {
                ...form,
                declaration: form.declaration ? 1 : 0,
                networking_requirements: networkingVisible ? form.networking_requirements : [],
                service_requirements: servicesVisible ? form.service_requirements : [],
            };
            if (!payload.expected_delivery_date) delete payload.expected_delivery_date;
            await api.post('/quote-requests', toFormData(payload));
            setDone(true);
            setForm(emptyQuoteForm());
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setError(messageFrom(err));
        } finally {
            setBusy(false);
        }
    };

    if (done) {
        return (
            <div className="page shell">
                <div className="success-card quote-thanks">
                    <CheckCircle2 />
                    <span className="eyebrow">Request received</span>
                    <h1>Thank you for contacting Nexify System!</h1>
                    <p>Your quotation request has been received successfully.</p>
                    <p>Our sales team will review your requirements and contact you within 1 business day with a customized quotation or to gather any additional information needed.</p>
                    <p>We look forward to helping you find the right IT solution for your business.</p>
                    <button type="button" className="btn" onClick={() => setDone(false)}>Submit another request</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page shell">
            <div className="page-title">
                <span className="eyebrow">Corporate quotations</span>
                <h1>Request a Quote</h1>
                <p>Tell us about your company and IT requirements. Our team will respond with a tailored quotation.</p>
            </div>

            <div className="contact-grid quote-layout">
                <div className="contact-info">
                    {[[Phone, 'Call us', settings.phone], [Mail, 'Email', settings.email], [MapPin, 'Visit', settings.address], [MessageCircle, 'WhatsApp', settings.whatsapp]].map(([Icon, title, text]) => (
                        <div key={title}><Icon /><span><b>{title}</b><p>{text || 'Available soon'}</p></span></div>
                    ))}
                </div>

                <form className="panel quote-form" onSubmit={submit}>
                    <section className="quote-section">
                        <h2>Company Information</h2>
                        <div className="form-grid">
                            <label>Company Name *<input required value={form.company_name} onChange={(e) => set('company_name', e.target.value)} /></label>
                            <label>Contact Person *<input required value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} /></label>
                            <label>Designation<input value={form.designation} onChange={(e) => set('designation', e.target.value)} /></label>
                            <label>Email Address *<input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></label>
                            <label>Phone / WhatsApp Number *<input required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="03XX XXXXXXX" /></label>
                            <label>Company Website <small>(optional)</small><input type="url" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" /></label>
                            <label className="full">Business Address<textarea rows="3" value={form.business_address} onChange={(e) => set('business_address', e.target.value)} /></label>
                        </div>
                    </section>

                    <section className="quote-section">
                        <h2>Product / Service Required</h2>
                        <div className="form-grid">
                            <label className="full">Requirement Type *
                                <select required value={form.requirement_type} onChange={(e) => set('requirement_type', e.target.value)}>
                                    <option value="">Select requirement</option>
                                    {REQUIREMENT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </label>
                        </div>
                    </section>

                    <section className="quote-section">
                        <h2>Product Details</h2>
                        <fieldset className="check-grid">
                            <legend>Preferred Brand</legend>
                            {PREFERRED_BRANDS.map((brand) => (
                                <label className="check" key={brand}>
                                    <input type="checkbox" checked={form.preferred_brands.includes(brand)} onChange={() => toggleList('preferred_brands', brand)} />
                                    {brand}
                                </label>
                            ))}
                        </fieldset>
                        <div className="form-grid" style={{ marginTop: 14 }}>
                            <label>Required Quantity *<input required value={form.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="e.g. 25 units" /></label>
                            <label className="full">Preferred Specifications<textarea rows="4" value={form.preferred_specs} onChange={(e) => set('preferred_specs', e.target.value)} placeholder="Processor, RAM, Storage, Screen Size, Graphics, etc." /></label>
                        </div>
                    </section>

                    <section className="quote-section">
                        <h2>Budget Range</h2>
                        <div className="radio-grid">
                            {BUDGET_RANGES.map((range) => (
                                <label className="check" key={range}>
                                    <input type="radio" name="budget_range" checked={form.budget_range === range} onChange={() => set('budget_range', range)} />
                                    {range}
                                </label>
                            ))}
                        </div>
                    </section>

                    {networkingVisible && (
                        <section className="quote-section">
                            <h2>Networking Requirements</h2>
                            <p className="quote-help">Select the networking products or services you require.</p>
                            <fieldset className="check-grid">
                                {NETWORKING_OPTIONS.map((item) => (
                                    <label className="check" key={item}>
                                        <input type="checkbox" checked={form.networking_requirements.includes(item)} onChange={() => toggleList('networking_requirements', item)} />
                                        {item}
                                    </label>
                                ))}
                            </fieldset>
                        </section>
                    )}

                    {servicesVisible && (
                        <section className="quote-section">
                            <h2>Service Requirements</h2>
                            <p className="quote-help">Select the services you require.</p>
                            <fieldset className="check-grid">
                                {SERVICE_OPTIONS.map((item) => (
                                    <label className="check" key={item}>
                                        <input type="checkbox" checked={form.service_requirements.includes(item)} onChange={() => toggleList('service_requirements', item)} />
                                        {item}
                                    </label>
                                ))}
                            </fieldset>
                        </section>
                    )}

                    <section className="quote-section">
                        <h2>Project Details</h2>
                        <p className="quote-help">Share anything that helps us prepare an accurate quotation — employees, devices, locations, timeline, or special needs.</p>
                        <div className="form-grid">
                            <label className="full">Tell us about your requirements
                                <textarea rows="6" value={form.project_details} onChange={(e) => set('project_details', e.target.value)} placeholder={"Examples:\n• Number of employees\n• Number of devices required\n• Office locations\n• Project timeline\n• Special requirements"} />
                            </label>
                        </div>
                    </section>

                    <section className="quote-section">
                        <h2>Delivery Information</h2>
                        <div className="form-grid">
                            <label>Delivery City
                                <select value={form.delivery_city} onChange={(e) => set('delivery_city', e.target.value)}>
                                    <option value="">Select city</option>
                                    {PAKISTAN_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
                                </select>
                            </label>
                            <label>Expected Delivery Date<input type="date" value={form.expected_delivery_date} onChange={(e) => set('expected_delivery_date', e.target.value)} /></label>
                        </div>
                    </section>

                    <section className="quote-section">
                        <h2>Attach Supporting Documents <small>(optional)</small></h2>
                        <p className="quote-help">Upload BOQ, tender documents, technical specs, network diagrams or requirement sheets. PDF, DOCX, XLSX, ZIP — max 5 files.</p>
                        <label className="file-drop">
                            <Upload size={18} />
                            <span>{attachmentNames || 'Choose files to upload'}</span>
                            <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip" onChange={(e) => set('attachments', Array.from(e.target.files || []).slice(0, 5))} />
                        </label>
                    </section>

                    <section className="quote-section">
                        <h2>Preferred Contact Method</h2>
                        <div className="radio-grid">
                            {CONTACT_METHODS.map((method) => (
                                <label className="check" key={method}>
                                    <input type="radio" name="preferred_contact" checked={form.preferred_contact === method} onChange={() => set('preferred_contact', method)} />
                                    {method}
                                </label>
                            ))}
                        </div>
                    </section>

                    <section className="quote-section">
                        <label className="check full declaration-check">
                            <input type="checkbox" required checked={form.declaration} onChange={(e) => set('declaration', e.target.checked)} />
                            I confirm that the information provided is accurate and authorize Nexify System to contact me regarding this quotation request.
                        </label>
                    </section>

                    {error && <p className="form-error">{error}</p>}
                    <button className="btn btn-block" disabled={busy}>{busy ? 'Submitting…' : 'Request a Quote'}</button>
                </form>
            </div>
        </div>
    );
}
