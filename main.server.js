const fs = require('fs');
const path = require('path');

const FILENAME = path.join(process.cwd(), 'res/netflix/ViewingActivity.csv');

module.exports = class NetflixCalendar {
	static init() {
		NetflixCalendar.importNetflixActivity();

		const watcher = fs.watch(FILENAME, { persistent: false }, (curr, prev) => {
			watcher.close();

			log('./reloading.STATS.Netflix', 'boot');

			NetflixCalendar.importNetflixActivity();
		});
	}

	static importNetflixActivity() {
		const file = fs.readFileSync(FILENAME).toString();

		for(const line of file.split('\n')) {
			if(!line.startsWith(calendarCfg.netflix.username + ',')) {
				continue;
			}

			const elements = line.split(',');

			const start = new Date(elements[1] + ' GMT');
			const end = new Date(elements[1] + ' GMT');
			const duration = elements[2].split(':');
			end.setHours(end.getHours() + parseInt(duration[0]));
			end.setMinutes(end.getMinutes() + parseInt(duration[1]));
			end.setSeconds(end.getSeconds() + parseInt(duration[2]));
			const id = 'Netflix-' + start;

			const field = {
				id: id,
				title: 'Netflix',
				description: elements[4],
				start,
				end,
				origin: ''
			};

			//console.log(field);

			const [query, values] = Database.buildInsertQuery('calendar', field);

			Database.execQuery(
				query,
				values
			);
		}

		log('Saved Netflix Activity', 'info');
	}
};