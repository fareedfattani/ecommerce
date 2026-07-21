import axios from 'axios';

const csrfMeta = () => document.querySelector('meta[name="csrf-token"]');
const csrf = csrfMeta()?.content;

const setCsrfToken = (token) => {
    if (!token) return;
    const meta = csrfMeta();
    if (meta) meta.content = token;
    api.defaults.headers.common['X-CSRF-TOKEN'] = token;
};

export const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
    },
});

api.interceptors.request.use((config) => {
    const token = csrfMeta()?.content;
    if (token) config.headers['X-CSRF-TOKEN'] = token;
    return config;
});

api.interceptors.response.use((response) => {
    setCsrfToken(response.data?.csrf_token);
    return response;
}, async (error) => {
    const config = error.config;
    if (error.response?.status === 419 && config && !config._csrfRetry) {
        config._csrfRetry = true;
        const { data } = await axios.get('/api/csrf-token', {
            withCredentials: true,
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        });
        setCsrfToken(data.csrf_token);
        config.headers['X-CSRF-TOKEN'] = data.csrf_token;
        return api(config);
    }
    return Promise.reject(error);
});

export const unwrap = (response) => {
    const payload = response?.data ?? response;
    return payload?.data ?? payload;
};

export const listFrom = (response) => {
    const payload = response?.data ?? response ?? {};
    const nested = payload?.data;
    const items = Array.isArray(nested) ? nested : Array.isArray(payload) ? payload : nested?.data ?? payload.items ?? [];
    return {
        items,
        meta: payload.meta ?? nested?.meta ?? {
            current_page: payload.current_page ?? nested?.current_page ?? 1,
            last_page: payload.last_page ?? nested?.last_page ?? 1,
            total: payload.total ?? nested?.total ?? items.length,
        },
    };
};

export const toFormData = (values) => {
    const form = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) value.forEach((item) => form.append(`${key}[]`, item));
        else if (typeof value === 'boolean') form.append(key, value ? '1' : '0');
        else if (typeof value === 'object' && !(value instanceof File)) form.append(key, JSON.stringify(value));
        else form.append(key, value);
    });
    return form;
};

export const messageFrom = (error) =>
    error?.response?.data?.message ||
    Object.values(error?.response?.data?.errors ?? {})?.flat()?.[0] ||
    error?.message ||
    'Something went wrong. Please try again.';
