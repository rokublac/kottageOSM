// ORDER MANAGEMENT CODE

import wixData from 'wix-data';

// for data logging
import { updateDataLogging } from 'backend/logging-utilities.jsw';

// dynamic inputs for orders
import { countInputError } from 'public/pub-om-utilities.js';
import { mainProgressBarUpdater } from 'public/pub-om-utilities.js';
import { contextProgressBarUpdater } from 'public/pub-om-utilities.js';

// button utilities
import { btnLabelFetch } from 'public/pub-om-utilities.js';
import { btnToggles } from 'public/pub-om-utilities.js';
import { btnDbQuery } from 'public/pub-om-utilities.js';

// ======== On ready (start) ======== //

// Progress bar code
$w.onReady(function () {
	$w('#allBtn').disable();
	btnLabelFetch($w('#allBtn'), $w('#pendingBtn'), $w('#inProdBtn'), $w('#completeBtn'));

	$w("#ordersDataset").onReady(() => {
		// progress bar initial load
		mainProgressBarUpdater($w('#mainRepeater'), "#ordersDataset");
		// notes inital load
		$w('#mainRepeater').forEachItem(($item) => {
			let dataObject = $item("#ordersDataset").getCurrentItem();
			let repeaterNote = $item('#notesInputBox');
			let noteIcon = $item('#notesIcon');
			let notesIconNoNote = $item('#notesIconNoNote');

			repeaterNote.value = dataObject.orderNote;
			if (repeaterNote.value.length === 0) {
				noteIcon.hide();
				notesIconNoNote.show();
			} else {
				noteIcon.show();
				notesIconNoNote.hide();
			}
		})
	})
});
// ========== On ready (end) ========= //

// ========== Navigation buttons (start) ========== //

export function allBtn_click(event) {
	// show loading text while fetching orders data
	$w('#fetchingOrdersTxt').show();
	// button UI mechanics
	btnToggles(event.target.id, $w('#allBtn'), $w('#pendingBtn'), $w('#inProdBtn'), $w('#completeBtn'));
	// Fetch from db - change repeater title and hide loading text when complete
	btnDbQuery(event.target.id, '#ordersDataset', $w('#mainRepeater'), $w('#fetchingOrdersTxt'), $w('#repeaterTitle'), 'All Orders');
}

export function pendingBtn_click(event) {
	$w('#fetchingOrdersTxt').show();
	btnToggles(event.target.id, $w('#allBtn'), $w('#pendingBtn'), $w('#inProdBtn'), $w('#completeBtn'));
	btnDbQuery(event.target.id, '#ordersDataset', $w('#mainRepeater'), $w('#fetchingOrdersTxt'), $w('#repeaterTitle'), 'Pending Orders');
}

export function inProdBtn_click(event) {
	$w('#fetchingOrdersTxt').show();
	btnToggles(event.target.id, $w('#allBtn'), $w('#pendingBtn'), $w('#inProdBtn'), $w('#completeBtn'));
	btnDbQuery(event.target.id, '#ordersDataset', $w('#mainRepeater'), $w('#fetchingOrdersTxt'), $w('#repeaterTitle'), 'In Production Orders');
}

export function completeBtn_click(event) {
	$w('#fetchingOrdersTxt').show();
	btnToggles(event.target.id, $w('#allBtn'), $w('#pendingBtn'), $w('#inProdBtn'), $w('#completeBtn'));
	btnDbQuery(event.target.id, '#ordersDataset', $w('#mainRepeater'), $w('#fetchingOrdersTxt'), $w('#repeaterTitle'), 'Completed Orders');
}


// ========== Navigation buttons (end) ========== //

// ========== Update box functions (Start) ========== //

// === Activate update UI toggle
export function updateBtn_click(event) {
	let $item = $w.at(event.context);
	let button = $item('#updateBtn');
	let box = $item('#updateBox');

	// if box is not open, expand it and vice versa
	if (box.collapsed) {
		box.expand().then(() => {
			button.label = 'Update -';
			$item('#circle').show();
		});
	} else {
		box.collapse().then(() => {
			button.label = 'Update';
			$item('#circle').hide();
		});
	}
}

// === Active Notes box toggle
export function notesIcon_click(event) {
	let $item = $w.at(event.context);
	let notesContainer = $item('#notesContainer');

	if (notesContainer.collapsed) {
		let dataObject = $item("#ordersDataset").getCurrentItem();
		$item('#notesInputBox').value = dataObject.orderNote;
		notesContainer.expand();
	} else if (notesContainer.expand) {
		notesContainer.collapse();
	}
}

// === No notes icon box toggle
export function notesIconNoNote_click(event) {
	let $item = $w.at(event.context);
	let notesContainer = $item('#notesContainer');

	if (notesContainer.collapsed) {
		let dataObject = $item("#ordersDataset").getCurrentItem();
		$item('#notesInputBox').value = dataObject.orderNote;
		notesContainer.expand();
	} else if (notesContainer.expand) {
		notesContainer.collapse();
	}
}

// === Status update function
export function updStatusDrpdown_change(event) {
	let $item = $w.at(event.context); // this scope restricts in the selected repeater and not the whole repeater
	let dataObject = $item("#ordersDataset").getCurrentItem(); // this will get the data only associated with that repeating container
	let dropDown = $item('#updStatusDrpdown');

	if (dropDown.value === dataObject.orderStatus) { // checking if user is trying to change the order status to its current status
		console.log(`status of order already ${dropDown.value}`);
	} else {
		let toUpdate = {
			"_id": dataObject._id,
			"orderCode": dataObject.orderCode,
			"custEmail": dataObject.custEmail,
			"custName": dataObject.custName,
			"currentCount": dataObject.currentCount,
			"endCount": dataObject.endCount,
			"productName": dataObject.productName,
			"orderStatus": dropDown.value, // value to update
			"orderNote": dataObject.orderNote
		};

		let loadingIcon = $item('#statusLoadIcon');

		wixData.update("orders", toUpdate)

			.then(() => {
				updateDataLogging(dataObject.orderStatus, dropDown.value, 'Status Update', dataObject.orderCode); // // =============> DATA LOGGER
			})
			.then(() => {
				loadingIcon.show();
				$item('#orderStatus').hide();
				$w('#ordersDataset').refresh() // refresh data to update the list
					.then(() => {
						console.log('status has been updated!');
						loadingIcon.hide();
						btnLabelFetch($w('#allBtn'), $w('#pendingBtn'), $w('#inProdBtn'), $w('#completeBtn')); // update button labels
						$item('#orderStatus').show();
						dropDown.value = 'Update Status'; //refersh to default dropdown text/value

					})
					.catch((err) => {
						console.log(err)
					})
			})
	}
}

// === Production count update function
export function updProdCount_keyPress(event) {
	let $item = $w.at(event.context); // this scope restricts in the selected repeater and not the whole repeater
	let dataObject = $item("#ordersDataset").getCurrentItem(); // this will get the data only associated with that repeating container
	let countInput = $item('#updProdCount');

	let key = event.key; // store key event

	if (key === 'Enter') {

		/* input checking for blanks, negatives and values above end production count number.
		Note that countInput.value is a string. Wix automatically converts strings into numers but for clarity I converted all values invovled in number logic
		into actual numbers with Number(string)*/

		// === Input error check (start) === //
		if (countInput.value === '') { // if input is blank
			countInputError($item("#errTxtBlank"));
		} else if (isNaN(countInput.value)) { // if input is  NaN
			countInputError($item("#errTxtBlank"));
		} else if (countInput.value === "-0") { // if input is -0. Without this logic, it will submit -0 into the DB
			countInputError($item("#errTxtBlank"));
		} else if (Number(countInput.value) < 0) { // if input < 0
			countInputError($item("#errTxtBelowZero"));
		} else if (Number(countInput.value) > dataObject.endCount) { // if input > production end count
			countInputError($item("#errTxtAboveEnd"));
		} else if (countInput.value.length >= 2 && countInput.value.charAt(0) === '0') { // odd error fix where if you enter a number starting with 0 such as 0987, it will still work
			countInputError($item("#errTxtBlank"));
			// === Input error check (end) === //
		} else {
			let toUpdate = {
				"_id": dataObject._id,
				"orderCode": dataObject.orderCode,
				"custEmail": dataObject.custEmail,
				"custName": dataObject.custName,
				"currentCount": Number(countInput.value), // only changing this data. Change to number to make sure its stored as an integer in the DB
				"endCount": dataObject.endCount,
				"productName": dataObject.productName,
				"orderStatus": dataObject.orderStatus,
				"orderNote": dataObject.orderNote
			};

			let loadingIcon = $item('#progressLoadIcon');
			let contextRepeater = $item('#mainRepeater');

			updateDataLogging(dataObject.currentCount, countInput.value, 'Production Count Update', dataObject.orderCode); // =============> DATA LOGGER

			wixData.update("orders", toUpdate)
				.then(() => {
					loadingIcon.show();
					$item('#orderProgress').hide();
					$w('#ordersDataset').refresh() // refresh data to update the list
						.then(() => {
							console.log('production count has been updated!');
							loadingIcon.hide();
							$item('#orderProgress').show();
							countInput.value = 'Update Status'; //refersh to default dropdown text/value
							contextProgressBarUpdater($item, "#ordersDataset"); // update progress bar
						})
				})
				.catch((err) => {
					console.log(err)
				})
		}
	}
}

export function notesInputBox_keyPress(event) {
	let $item = $w.at(event.context);
	let dataObject = $item("#ordersDataset").getCurrentItem();
	let notesInput = $item('#notesInputBox');
	let key = event.key;

	if (key === 'Enter') {
		let toUpdate = {
			"_id": dataObject._id,
			"orderCode": dataObject.orderCode,
			"custEmail": dataObject.custEmail,
			"custName": dataObject.custName,
			"currentCount": dataObject.currentCount,
			"endCount": dataObject.endCount,
			"productName": dataObject.productName,
			"orderStatus": dataObject.orderStatus,
			"orderNote": notesInput.value
		};

		updateDataLogging(dataObject.orderNote, notesInput.value, 'Note Update', dataObject.orderCode); // =============> DATA LOGGER

		wixData.update("orders", toUpdate)
			.then(() => {
				$w('#ordersDataset').refresh() // refresh data to update the list
					.then(() => {
						if (notesInput.value.length === 0) {
							$item('#notesIcon').hide()
							$item('#notesIconNoNote').show()
						} else {
							$item('#notesIconNoNote').hide()
							$item('#notesIcon').show()
						}
						$item('#notesNotifyTxt').expand().then(() => {
							setTimeout(() => {
								$item('#notesNotifyTxt').collapse();
							}, 1500);
						})
					})
			})
			.catch((err) => {
				console.log(err)
			})
	}
}
