import * as Cesium from 'cesium';
import { CESIUM_API_URL } from '@/modules/cesium/types';

const CESIUM_CLIENT_ID = '2363';
const CESIUM_REDIRECT_URI = 'http://localhost:5173/oauth/cesium/callback';

function generateCodeVerifier(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);

	return btoa(String.fromCharCode(...array))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
	const data = new TextEncoder().encode(codeVerifier);

	const digest = await crypto.subtle.digest('SHA-256', data);

	return btoa(String.fromCharCode(...new Uint8Array(digest)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

export async function connectToCesiumIon() {
	const codeVerifier = generateCodeVerifier();
	const codeChallenge = await generateCodeChallenge(codeVerifier);

	const state = crypto.randomUUID();

	sessionStorage.setItem('cesium_code_verifier', codeVerifier);

	sessionStorage.setItem('cesium_oauth_state', state);

	const params = new URLSearchParams({
		response_type: 'code',
		client_id: CESIUM_CLIENT_ID,
		redirect_uri: CESIUM_REDIRECT_URI,
		scope: 'assets:list assets:read assets:write profile:read',
		state,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
	});

	window.location.href = `https://ion.cesium.com/oauth?${params.toString()}`;
}

export async function exchangeCesiumCode(code: string) {
	const codeVerifier = sessionStorage.getItem('cesium_code_verifier');

	if (!codeVerifier) {
		throw new Error('Cesium OAuth code verifier not found');
	}

	const response = await fetch('https://api.cesium.com/oauth/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: CESIUM_CLIENT_ID,
			code,
			redirect_uri: CESIUM_REDIRECT_URI,
			code_verifier: codeVerifier,
		}),
	});

	if (!response.ok) {
		const error = await response.text();

		throw new Error(`Cesium OAuth token exchange failed: ${error}`);
	}

	return await response.json();
}

export function setCesiumIonToken(token: string) {
	Cesium.Ion.defaultAccessToken = token;
}

export async function getCesiumIonUser(accessToken: string) {
	const response = await fetch(`${CESIUM_API_URL}/me`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to get Cesium Ion user: ${response.status}`);
	}

	return await response.json();
}
