import jQuery from 'jquery';
const $: JQueryStatic = jQuery;

import EventData from "./EventData";

class FormFieldsManager {
    // Form fields: add event
    public $eventTitle: JQuery;
    public $errorTitle: JQuery;
    public $eventDescription: JQuery;
    public $errorDescription: JQuery;
    public $eventDateStart: JQuery;
    public $eventTimeStart: JQuery;
    public $errorDateStart: JQuery;
    public $eventDateEnd: JQuery;
    public $eventTimeEnd: JQuery;
    public $errorDateEnd: JQuery;

    // Filter Fields: marker by color
    public $markerGreen: JQuery;
    public $markerOrange: JQuery;
    public $markerBlue: JQuery;
    public $markerRed: JQuery;

    constructor() {
        this.$eventTitle = $( '#event-title' );
        this.$errorTitle = $('#error-title');
        this.$eventDescription = $( '#event-description' );
        this.$errorDescription = $( '#error-description' );
        this.$eventDateStart = $( '#event-date-start' );
        this.$eventTimeStart = $( '#event-hour-start' );
        this.$errorDateStart = $('#error-date-start');
        this.$eventDateEnd = $( '#event-date-end' );
        this.$eventTimeEnd = $ ( '#event-hour-end' );
        this.$errorDateEnd = $('#error-date-end');

        this.$markerGreen = $( '#marker-green' );
        this.$markerOrange = $( '#marker-orange' );
        this.$markerBlue = $( '#marker-blue' );
        this.$markerRed = $( '#marker-red' );
    }

    /**
     * Check if fields are empty and put message error if not
     *
     * @param newTitle
     * @param newDescription
     * @param newDateStart
     * @param newDateEnd
     */
    checkAddEventFields( newTitle: string, newDescription: string, newDateStart: string, newDateEnd: string ): boolean {
        let result: boolean = true;

        if( !newTitle ) {
            this.$errorTitle.text('Rentrez un titre');
            this.$eventTitle.addClass('error-field');
            result = false;
        }
        else {
            this.$errorTitle.text('');
            this.$eventTitle.removeClass('error-field');
        }

        if( !newDescription ) {
            this.$errorDescription.text('Rentrez une description');
            this.$eventDescription.addClass('error-field');
            result = false;
        }
        else {
            this.$errorDescription.text('');
            this.$eventDescription.removeClass('error-field');
        }

        if( !newDateStart ) {
            this.$errorDateStart.text('Rentrez la date de début');
            this.$eventDateStart.addClass('error-field');
            result = false;
        }
        else {
            this.$errorDateStart.text('');
            this.$eventDateStart.removeClass('error-field');
        }

        if( !newDateEnd ) {
            this.$errorDateEnd.text('Rentrez la date de fin');
            this.$eventDateEnd.addClass('error-field');
            result = false;
        }
        else {
            this.$errorDateEnd.text('');
            this.$eventDateEnd.removeClass('error-field');
        }

        return result;
    }

    /**
     * Check if dates are valid and put message error if not
     *
     * @param newDateStart
     * @param newDateEnd
     */
    checkAddEventDates( newDateStart: Date, newDateEnd: Date ): boolean {
        let result: number = newDateEnd.getTime() - newDateStart.getTime();

        if( result < 0 ) {
            this.$errorDateEnd.text('Les dates ne sont pas bonnes');
            this.$eventDateStart.addClass('error-field');
            this.$eventTimeStart.addClass('error-field');
            this.$eventDateEnd.addClass('error-field');
            this.$eventTimeEnd.addClass('error-field');
            return false;
        }
        else {
            this.$errorDateEnd.text('');
            this.$eventDateStart.removeClass('error-field');
            this.$eventTimeStart.removeClass('error-field');
            this.$eventDateEnd.removeClass('error-field');
            this.$eventTimeEnd.removeClass('error-field');
            return true;
        }
    }

    /**
     * Reset event form fields
     */
    resetEventFields() {
        this.$eventTitle.val( '' );
        this.$eventDescription.val( '' );
        this.$eventDateStart.val( '' );
        this.$eventTimeStart.val('12:00');
        this.$eventDateEnd.val( '' );
        this.$eventTimeEnd.val('12:00');
    }

    /**
     * Set event date in edit form fields
     *
     * @param eventData
     */
    setEditEventFields( eventData: EventData ) {
        const
            date_start_arr = EventData.getFormatDate(eventData.date_start),
            date_end_arr = EventData.getFormatDate(eventData.date_end);

        this.$eventTitle.val( eventData.title );
        this.$eventDescription.val( eventData.description );
        this.$eventDateStart.val( date_start_arr[0] );
        this.$eventTimeStart.val( date_start_arr[1] );
        this.$eventDateEnd.val( date_end_arr[0] );
        this.$eventTimeEnd.val( date_end_arr[1] );
    }
}

const formFieldsManager = new FormFieldsManager;
export default formFieldsManager;