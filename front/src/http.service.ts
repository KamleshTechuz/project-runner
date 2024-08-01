import axios from 'axios';

const baseUrl = (import.meta as any).env.VITE_API_BASE_URL;
type headerType =  {[key: string]: string;};
const defaultHeaders = {'Content-Type': 'application/json',};

axios.interceptors.request.use(async (config) => {


	config.baseURL = baseUrl;
	config.headers['Access-Control-Allow-Origin'] = '*';
	return config;
}, (error) => {
	return Promise.reject(error);
});

axios.interceptors.response.use(
	(response) => response?.data,
	(error) => {
		if (error.response && error.response.status === 401) {
            localStorage.clear();
            window.location.replace('/');
        }
		throw error?.response?.data;
	}
);

export const httpServices = {
	// Get request
	getData: async (reqUrl: string, params = {}) => {
	const response = await axios.get(reqUrl, {params});
	return response;
},
	//  post request
	postData: async (reqUrl: string, data = {}, headers?: headerType) => {
	const response = await axios.post(reqUrl, data, {headers: { ...defaultHeaders, ...headers } });
	return response;
},
	//  Put request
	putData: async (reqUrl: string, data = {}, headers?: headerType) => {
	const response = await axios.put(reqUrl, data, {headers: { ...defaultHeaders, ...headers } });
	return response;
},
	//  Patch request
	patchData: async (reqUrl: string, data = {}, headers?: headerType) => {
	const response = await axios.patch(reqUrl, data, {headers: { ...defaultHeaders, ...headers } });
	return response;
},
	// Delete request
	deleteData: async (reqUrl: string, params = {}) => {
	const response = await axios.delete(reqUrl, params);
	return response;
}
};