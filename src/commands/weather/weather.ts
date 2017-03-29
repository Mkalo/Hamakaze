import * as bluebird from 'bluebird';
import { Message } from 'discord.js';
import { Command, CommandMessage, CommandoClient } from 'discord.js-commando';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request-promise';

// tslint:disable-next-line:variable-name
const Canvas: any = require('canvas');
const fsPromise: any = bluebird.promisifyAll(fs);

const { googleAPIKey, weatherAPIKey }: { googleAPIKey: string, weatherAPIKey: string } = require('../../settings');
const { version }: { version: string } = require('../../../package');

type response = {
	status: string;
	results: {
		formatted_address: string;
		geometry: {
			location: {
				lat: string;
				lng: string;
			};
		};
		address_components: {}[];
	}[];
};

type res = {
	currently: {
		summary: string;
		icon: string;
		precipProbability: number;
		temperature: number;
		humidity: number;
	}
};

export default class WeatherCommand extends Command {
	constructor(client: CommandoClient) {
		super(client, {
			name: 'weather',
			aliases: ['w', '☁', '⛅', '⛈', '🌤', '🌥', '🌦', '🌧', '🌨', '🌩', '🌪'],
			group: 'weather',
			memberName: 'weather',
			description: 'Get the weather.',
			throttling: {
				usages: 1,
				duration: 30
			},

			args: [
				{
					key: 'location',
					prompt: 'what location would you like to have information on?\n',
					type: 'string'
				}
			]
		});
	}

	public async run(msg: CommandMessage, args: { location: string }): Promise<Message | Message[]> {
		const { location }: { location: string } = args;
		const Image: any = Canvas.Image;

		Canvas.registerFont(path.join(__dirname, '..', '..', 'assets', 'weather', 'fonts', 'Roboto-Regular.ttf'), { family: 'Roboto' });
		Canvas.registerFont(path.join(__dirname, '..', '..', 'assets', 'weather', 'fonts', 'RobotoCondensed-Regular.ttf'), { family: 'Roboto Condensed' });
		Canvas.registerFont(path.join(__dirname, '..', '..', 'assets', 'weather', 'fonts', 'RobotoMono-Light.ttf'), { family: 'Roboto Mono' });

		if (!googleAPIKey) return msg.reply('my Commander has not set the Google API Key, go yell at him!');
		if (!weatherAPIKey) return msg.reply('my Commander has not set the Weather API Key, go yell at him!');

		const locationURI: string = encodeURIComponent(location.replace(/ /g, '+'));
		const response: response = await request({
			uri: `https://maps.googleapis.com/maps/api/geocode/json?address=${locationURI}&key=${googleAPIKey}`,
			headers: { 'User-Agent': `Hamakaze v${version} (https://github.com/WeebDev/Hamakaze/)` },
			json: true
		});

		if (response.status !== 'OK') return msg.reply(this._handleNotOK(msg, response.status));
		if (response.results.length === 0) return msg.reply('your request returned no results.');

		const geocodeLocation: string = response.results[0].formatted_address;
		const params: string = `${response.results[0].geometry.location.lat},${response.results[0].geometry.location.lng}`;

		const locality: {} = response.results[0].address_components.find((loc: { types: string }) => loc.types.includes('locality'));
		const governing: {} = response.results[0].address_components.find((gov: { types: string }) => gov.types.includes('administrative_area_level_1'));
		const country: {} = response.results[0].address_components.find((cou: { types: string }) => cou.types.includes('country'));
		const continent: {} = response.results[0].address_components.find((con: { types: string }) => con.types.includes('continent'));

		const city: { long_name?: string } = locality || governing || country || continent || {};
		const state: { long_name?: string } = locality && governing ? governing : locality ? country : {};

		const res: res = await request({
			uri: `https://api.darksky.net/forecast/${weatherAPIKey}/${params}?exclude=minutely,hourly,flags&units=auto`,
			headers: { 'User-Agent': `Hamakaze v${version} (https://github.com/WeebDev/Hamakaze/)` },
			json: true
		});

		const condition: string = res.currently.summary;
		const icon: string = res.currently.icon;
		const chanceOfRain: number = Math.round((res.currently.precipProbability * 100) / 5) * 5;
		const temperature: number = Math.round(res.currently.temperature);
		const humidity: number = Math.round(res.currently.humidity * 100);

		const canvas: any = new Canvas(400, 180);
		const ctx: any = canvas.getContext('2d');
		const base: { src: string } = new Image();
		const cond: { src: string } = new Image();
		const humid: { src: string } = new Image();
		const precip: { src: string } = new Image();

		let theme: string = 'light';
		let fontColor: string = '#FFFFFF';
		if (icon === 'snow' || icon === 'sleet' || icon === 'fog') {
			theme = 'dark';
			fontColor = '#444444';
		}

		const generate: Function = (): void => {
			ctx.drawImage(base, 0, 0);
			ctx.scale(1, 1);
			ctx.patternQuality = 'billinear';
			ctx.filter = 'bilinear';
			ctx.antialias = 'subpixel';

			ctx.font = '20px Roboto';
			ctx.fillStyle = fontColor;
			ctx.fillText(city.long_name ? city.long_name : 'Unknown', 35, 50);

			ctx.font = '16px Roboto';
			ctx.fillStyle = theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
			ctx.fillText(state.long_name ? state.long_name : '', 35, 72.5);

			ctx.font = "48px 'Roboto Mono'";
			ctx.fillStyle = fontColor;
			ctx.fillText(`${temperature}°`, 35, 140);

			ctx.font = '16px Roboto';
			ctx.textAlign = 'right';
			ctx.fillText(condition, 370, 142);

			ctx.drawImage(cond, 325, 31);
			ctx.drawImage(humid, 358, 88);
			ctx.drawImage(precip, 358, 108);

			ctx.font = "16px 'Roboto Condensed'";
			ctx.fillText(`${humidity}%`, 353, 100);
			ctx.fillText(`${chanceOfRain}%`, 353, 121);
		};

		base.src = await fsPromise.readFileAsync(this._getBase(icon));
		cond.src = await fsPromise.readFileAsync(path.join(__dirname, '..', '..', 'assets', 'weather', 'icons', theme, `${icon}.png`));
		humid.src = await fsPromise.readFileAsync(path.join(__dirname, '..', '..', 'assets', 'weather', 'icons', theme, 'humidity.png'));
		precip.src = await fsPromise.readFileAsync(path.join(__dirname, '..', '..', 'assets', 'weather', 'icons', theme, 'precip.png'));
		generate();

		return msg.channel.sendFile(canvas.toBuffer(), `${geocodeLocation}.png`);
	}

	private _handleNotOK(msg: CommandMessage, status: string): string {
		if (status === 'ZERO_RESULTS') return `your request returned no results.`;
		else if (status === 'REQUEST_DENIED') return `Geocode API Request was denied.`;
		else if (status === 'INVALID_REQUEST') return `Invalid Request,`;
		else if (status === 'OVER_QUERY_LIMIT') return `Query Limit Exceeded. Try again tomorrow.`;
		else return `Unknown.`;
	}

	private _getBase(icon: string): string {
		if (icon === 'clear-day' || icon === 'partly-cloudy-day') {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'day.png');
		} else if (icon === 'clear-night' || icon === 'partly-cloudy-night') {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'night.png');
		} else if (icon === 'rain') {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'rain.png');
		} else if (icon === 'thunderstorm') {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'thunderstorm.png');
		} else if (icon === 'snow' || icon === 'sleet' || icon === 'fog') {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'snow.png');
		} else if (icon === 'wind' || icon === 'tornado') {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'windy.png');
		} else if (icon === 'cloudy') {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'cloudy.png');
		} else {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'cloudy.png');
		}
	}
}
