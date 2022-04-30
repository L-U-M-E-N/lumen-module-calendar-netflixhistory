import fs from 'fs';
import path from 'path';

export default class NetflixCalendar {
	static init() {
		NetflixCalendar.importNetflixActivity();

		const watcher = fs.watch(path.join(config['netflix']['folder'], 'ViewingActivity.csv'), { persistent: false }, (curr, prev) => {
			watcher.close();

			log('./reloading.STATS.Netflix', 'boot');

			NetflixCalendar.importNetflixActivity();
		});
	}

	static async insertEvent(minDate, line) {
		const elements = line.split(',');

		const start = new Date(elements[1] + ' GMT');
		const end = new Date(elements[1] + ' GMT');
		const duration = elements[2].split(':');
		end.setHours(end.getHours() + parseInt(duration[0]));
		end.setMinutes(end.getMinutes() + parseInt(duration[1]));
		end.setSeconds(end.getSeconds() + parseInt(duration[2]));
		const id = 'Netflix-' + start;

		if(start.getTime() <= minDate.getTime()) {
			return;
		}

		const field = {
			id: id,
			title: 'Netflix',
			description: elements[4],
			start,
			end,
			origin: ''
		};

		if((await Database.execQuery('SELECT id FROM calendar WHERE id = $1', [id])).rows.length === 0) {
			const [query, values] = Database.buildInsertQuery('calendar', field);

			await Database.execQuery(
				query,
				values
			);
		}
	}

	static async importNetflixActivity() {
		const minDate = (await Database.execQuery(
			'SELECT MAX(start) as min FROM calendar WHERE title = $1', ['Netflix']
		)).rows[0].min;
		minDate.setHours(minDate.getHours() - 6); // Safety margin

		const file = fs.readFileSync(path.join(config['netflix']['folder'], 'ViewingActivity.csv')).toString();

		await Promise.allSettled(file.split('\n').map(async(line) => {
			if(!line.startsWith(global.config.netflix.username + ',')) {
				return;
			}

			await NetflixCalendar.insertEvent(minDate, line);
		}));

		log('Saved Netflix Activity', 'info');
	}
}
