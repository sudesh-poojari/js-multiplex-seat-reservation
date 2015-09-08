var MovieReservation = (function () {

	"use strict";

	var MovieReservation = function () {

		//Default reservations and seats
		this.reservations = {};

		//Default reserved seats key - string format of seat, value - tuple of (row, col)
		this.reservedSeats = {};

		//Create the multiplex seat matrix
		this.seatRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
		this.seatCols = [];

		for (var i = 1; i <= 12; i++) {
			this.seatCols.push(i);
		}

		//Calculate maximum seats available
		this.maxSeats = this.seatRows.length * this.seatCols.length;

	}

	MovieReservation.prototype.add = function(name, seats) {
		this.reservations[name] = seats;

		for (var i in seats) {
			var seat = seats[i];
			var strSeat = this._seatToString(seat);
			this.reservedSeats[strSeat] = seat;
		}
	};

	MovieReservation.prototype.get = function(name) {

		if (typeof this.reservations[name] == 'undefined') {
			return false;
		}

		return this.reservations[name];

	};

	MovieReservation.prototype.delete = function(name) {
		if (typeof this.reservations[name] == 'undefined') {
			return false;
		}

		var seats = this.reservations[name];

		for (var i in seats) {
			var seat = seats[i];
			var strSeat = this._seatToString(seat);

			delete this.reservedSeats[strSeat];
		}

		delete this.reservations[name];

	};

	MovieReservation.prototype.reset = function() {
		//Default reservations and seats
		this.reservations = {};
		this.reservedSeats = {};
	};

	MovieReservation.prototype.getAvailableSeats = function () {

		var reservedSeatsCount = 0;
		for (var i in this.reservedSeats) {
			reservedSeatsCount++;
		}

		return this.maxSeats - reservedSeatsCount;
	};

	MovieReservation.prototype._seatToString = function(seat) {
		return seat[0].toString() + seat[1].toString();
	}

	return MovieReservation;
})();


var ReservationUI = (function () {

	"use strict";

	var ReservationUI = function () {
		this.movieReservation = new MovieReservation();

		//NEW_FORM, SEAT_RESERVATION, RESERVATION_DATA 
		this.currentPage = 'NEW_FORM';

		this.userName = '';
		this.numberOfSeats = '';

		this.selectedSeats = [];

		this.drawSeats();
		this.bindEvents();

	}

	ReservationUI.prototype.drawSeats = function () {

		var htm = '';

		var row, col, seatSelectedClass = '';

		//Draw Column number row
		htm += '<div class="row seat-row "><div class="col-xs-1">&nbsp;</div><div class="col-xs-11">';
		for (var j in this.movieReservation.seatCols) {
			col = this.movieReservation.seatCols[j];
			htm += '<div class="col-xs-1 col-b">'+col+'</div>';
		}
		htm += '</div></div>';

		//Draw seat rows
		for (var i in this.movieReservation.seatRows) {

			row = this.movieReservation.seatRows[i];
			htm += '<div class="row seat-row "><div class="col-xs-1 col-b">'+row+'</div><div class="col-xs-11">';

			for (var j in this.movieReservation.seatCols) {
				col = this.movieReservation.seatCols[j];

				htm += '<div data-row="'+ row +'" data-col="'+ col +'" class="seat-'+row+col+' col-xs-1 seat-col"><i class="icon-chair"></i></div>';
			}

			htm += '</div></div>';
		}

		$('#seatselection .seats').html(htm);

	};

	//After every new reservation refresh seats
	ReservationUI.prototype.refreshSeats = function () {

		$('.reserved').removeClass('reserved');
		$('.selected').removeClass('selected');

		for (var seatString in this.movieReservation.reservedSeats) {
			$('.seat-' + seatString).addClass('reserved');
		}

	};

	//After every new reservation update data list
	ReservationUI.prototype.refreshReservationList = function () {

		var htm = '', seatsStr = '', itr = 1, seatStr;
		for (var name in this.movieReservation.reservations) {
			var seats = this.movieReservation.reservations[name];

			seatsStr = '';

			for (var i in seats) {
				seatStr = this.movieReservation._seatToString(seats[i]);
				if (i > 0) {
					seatsStr += ', ';
				}
				seatsStr += seatStr;
			}

			htm += '<tr>';
			htm += '<td>'+ itr +'</td>';
			htm += '<td>'+ name +'</td>';
			htm += '<td>'+ seatsStr +'</td>';
			htm += '</tr>';

			itr++;
		}

		$('.res-data-tbody').html(htm);
	};

	ReservationUI.prototype.formSubmitted = function () {

		var frmContainer = $('#new-reservation-form');

		var name = frmContainer.find('#user_name').val();
		var seats = parseInt(frmContainer.find('#number_seats').val());

		var hasError = false;

		frmContainer.find('.error').text('').hide();

		if (name.length <= 0) {
			frmContainer.find('.user_name_error').text('Required').show();
			hasError = true;
		} else if (typeof this.movieReservation.reservations[name] != 'undefined') {
			hasError = true;
			frmContainer.find('.user_name_error').text('Name already reserved.').show();
		}

		if (isNaN(seats)) {
			hasError = true;
			frmContainer.find('.seats_error').text('Enter valid seats.').show();
		} else if (seats <= 0) {
			hasError = true;
			frmContainer.find('.seats_error').text('Seats should be greater than 0.').show();
		} else if (seats > this.movieReservation.getAvailableSeats()) {
			hasError = true;
			frmContainer.find('.seats_error').text('These number of seats are not available.').show();
		}

		if (hasError) {
			return;
		}

		this.userName = name;
		this.numberOfSeats = seats;

		this.showPage('SEAT_RESERVATION');

	};
	
	ReservationUI.prototype.seatsSelected = function (seat) {

		//If clicked on reserved seat dont do anything
		if (seat.hasClass('reserved')) {
			return;
		}

		var row = seat.data('row');
		var col = seat.data('col');

		var seatTuple = [row, col];

		//If seat was selected unselect it
		if (seat.hasClass('selected')) {
			for (var i in this.selectedSeats) {
				var seatSelected = this.selectedSeats[i];

				if (seatSelected[0] == row &&
					seatSelected[1] == col) {

					this.selectedSeats.splice(i, 1);
					seat.removeClass('selected');
					return;
				}
			}
		}

		//Check if user already selected the number of seats
		if (this.selectedSeats.length == this.numberOfSeats) {
			$('.seat-error').text('You selected all request seats.');
			$('#errorModal').modal('show');
			return;
		}
		
		var seatStr = this.movieReservation._seatToString(seatTuple);

		if (typeof this.movieReservation.reservedSeats[seatStr] != 'undefined') {
			return;
		}

		seat.addClass('selected');

		this.selectedSeats.push(seatTuple);

	};

	ReservationUI.prototype.seatsSelectionComplete = function () {

		if (this.selectedSeats.length < this.numberOfSeats) {
			$('.seat-error').text('Please select all seats you have requested.');
			$('#errorModal').modal('show');
			return;
		}

		this.movieReservation.add(this.userName, this.selectedSeats);
		this.refreshSeats();

		this.userName = '';
		this.numberOfSeats = '';
		this.selectedSeats = [];

		this.showPage('RESERVATION_DATA');

	};

	ReservationUI.prototype.showPage = function(page) {

		$('#frm, #seatselection, #reservations').hide();

		$('.nav .active').removeClass('active');

		switch (page) {

			case 'NEW_FORM':
				var el = $('#frm');
				el.find('#user_name').val(this.userName);
				el.find('#number_seats').val(this.numberOfSeats);
				$('.nav .frm').addClass('active');
				el.show();
				break;

			case 'SEAT_RESERVATION':
				this.refreshSeats();
				$('#seatselection').show();
				break;

			case 'RESERVATION_DATA':
				this.refreshReservationList();
				$('.nav .res-data').addClass('active');
				$('#reservations').show();
				break;

			case 'CLEAR_DATA':
				$('#confirmModal').modal();
				this.refreshReservationList();
				$('.nav .res-data').addClass('active');
				$('#reservations').show();
				break;

		}

	};

	ReservationUI.prototype.deleteConfirmed = function () {
		this.movieReservation.reset();
		this.refreshSeats();
		this.refreshReservationList();
		$('.nav .res-data').addClass('active');
		$('#reservations').show();
		$('#confirmModal').modal('hide');
	};

	ReservationUI.prototype.bindEvents = function () {

		var _this = this;

		//New Reservation form
		$('#new-reservation-form').bind('submit', function () {
			_this.formSubmitted();
			return false;
		});

		//Seat clicked
		$(document).delegate('.seat-col', 'click', function () {
			var el = $(this);
			_this.seatsSelected(el);
		});

		//Seat Selection confirmed
		$('.btn-confirm-selection').bind('click', function () {
			_this.seatsSelectionComplete();
		});

		$('.btn-confirm').bind('click', function () {
			_this.deleteConfirmed();
		});

		//Bind Menu
		$('.nav a').bind('click', function (e) {
			var el = $(this);
			_this.showPage(el.data('page'));
			return false;
		});
	};

	return ReservationUI;

})();

$(document).ready(function () {
	var reservation = new ReservationUI();
	reservation.showPage('NEW_FORM');
});