module.exports = { formatter };

function formatter(data) {

	class Event {
		constructor(summary, location, description, startDateTime, endDateTime, recurrence) {
			this.summary = summary;
			this.location = location;
			this.description = description;
			this.start = startDateTime;
			this.end = endDateTime;
			this.recurrence = recurrence;
		}
	}

	class Start {
		constructor(dateTime, timeZone) {
			this.dateTime = dateTime;
			this.timeZone = timeZone;
		}
	}

	class End {
		constructor(dateTime, timeZone) {
			this.dateTime = dateTime;
			this.timeZone = timeZone;
		}
	}

	let dataNoRepeat = [];
	let events = [];

	// get rid of repeats
	for (let i = 0; i < data.length; i++) {
		if (!dataNoRepeat.includes(data[i])) {
			dataNoRepeat.push(data[i]);
		}
	}

	for (let i = 0; i < data.length; i++) {
		data[i] = (data[i].replace(/\t/g, '').replace(/\n/g, ' ').replace(/<\/?[^>]+(>|$)/g, ''));
		data[i] = data[i].replace(/ /g, '');

		// find class name
		let componentIndex = data[i].indexOf('Component');
		let className = data[i].slice(0, componentIndex);


		// find class type
		let classType = data[i].slice(componentIndex + 10, componentIndex + 13);

		// find section
		let sectionIndex = data[i].indexOf('Section');
		let classSection = data[i].slice(sectionIndex + 8, sectionIndex + 11);


		// find instructor
		let instructorIndex = data[i].indexOf('Instructor');
		let timeIndex = data[i].indexOf('Time');
		let classInstructor = data[i].slice(instructorIndex + 11, timeIndex);

		// find time (start and end time)
		let dayIndex = data[i].indexOf('Day');
		let classTime = data[i].slice(timeIndex + 5, dayIndex);

		// find start time
		let classStartTime12 = data[i].slice(timeIndex + 6, timeIndex + 13);
		let classStartTime;
		let classStartTimeHour;
		let classStartTimeMinute;

		// AM, we only need to remove the 'AM' part
		if (classStartTime12.indexOf('AM') !== -1) {
			classStartTimeHour = classStartTime12.slice(0, 2);
			classStartTimeMinute = classStartTime12.slice(3, 5);
		}
		// dont change 12 to 24
		else if (classStartTime12.indexOf('12') !== -1) {
			classStartTimeHour = classStartTime12.slice(0, 2);
			classStartTimeMinute = classStartTime12.slice(3, 5);
		}
		// PM, we need to convert it to 24 hour and remove the 'PM'
		else {
			classStartTimeHour = (+(classStartTime12.slice(0, 2)) + +12);
			classStartTimeMinute = classStartTime12.slice(3, 5);
		}
		classStartTime = classStartTimeHour + ':' + classStartTimeMinute + ':' + '00';


		//find end time
		let classEndTime12 = data[i].slice(timeIndex + 14, timeIndex + 21);
		let classEndTimeHour;
		let classEndTimeMinute;
		let classEndTime;
		// AM, we need to remove the 'AM' part
		if (classEndTime12.indexOf('AM') !== -1) {
			classEndTimeHour = classEndTime12.slice(0, 2);
			classEndTimeMinute = classEndTime12.slice(3, 5);
		}
		// dont change 12 to 24
		else if (classEndTime12.indexOf('12') !== -1) {
			classEndTimeHour = classEndTime12.slice(0, 2);
			classEndTimeMinute = classEndTime12.slice(3, 5);
		}
		// PM, we need to convert it to 24 hour and remove the 'PM'
		else {
			classEndTimeHour = +(classEndTime12.slice(0, 2)) + +12;
			classEndTimeMinute = classEndTime12.slice(3, 5);
		}
		classEndTime = classEndTimeHour + ':' + classEndTimeMinute + ':' + '00';

		// find day (mon, tue, wed, thurs, fri)
		let locationIndex = data[i].indexOf('Location');
		let classDay = data[i].slice(dayIndex + 5, locationIndex);
		let classDate;
		const base = '2019-09-';
		// determine the date
		switch (classDay) {
			case 'Mon':
				classDate = base + '09';
				break;
			case 'Tues':
				classDate = base + '10';
				break;
			case 'Wed':
				classDate = base + '11';
				break;
			case 'Thurs':
				classDate = base + '12';
				break;
			case 'Fri':
				classDate = base + '13';
				break;
		}
		let timeZone = 'Canada/Eastern';
		let timeZoneOffset = '-04:00';
		let classStartDateTime = classDate + 'T' + classStartTime + timeZoneOffset;
		let classEndDateTime = classDate + 'T' + classEndTime + timeZoneOffset;

		// recurrence
		let recurrence = ["RRULE:FREQ=WEEKLY;UNTIL=20191213T000000Z"];

		// find location
		let classLocation = data[i].slice(locationIndex + 9);


		//console log all the info for each class
		    /*console.log('class name: ' + className);
			console.log('type: ' + classType);
			console.log('section: ' + classSection);
			console.log('instructor: ' + classInstructor);
			console.log('start: ' + classStartDateTime);
			console.log('end: ' + classEndDateTime);
			console.log('location: ' + classLocation);*/


		// adjust formatting to build the event
		className = className + ' (' + classType + ')';
		let description = 'Instructor: ' + classInstructor + '\n' + 'Section: ' + classSection + '\n\n\n\n' + 'This event was created by calendarly.';
		let start = new Start(classStartDateTime, timeZone);
		let end = new End(classEndDateTime, timeZone);

		// build event object
		let tempBlock = new Event(className, classLocation, description, start, end, recurrence);

		let json = JSON.stringify(tempBlock);
		events.push(json);
	}

	return(events);

}
