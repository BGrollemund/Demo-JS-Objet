import config from '../../app.config.json';

import jQuery from 'jquery';
import mapboxgl, {LngLatLike, Map, MapboxOptions, Marker, Popup} from "mapbox-gl";

import EventsStorage from "./EventsStorage";
import EventData from "./EventData";

const $: JQueryStatic = jQuery;

class App {
    public $eventAdd: JQuery;
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
    public $eventsReset: JQuery;

    public $cmdPanelMask: JQuery;
    public $loader: JQuery;

    public eventsStorage: EventsStorage;
    public map: Map;
    public newEvent: EventData;

    constructor() {
        this.$eventAdd = $( '#event-add' );
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
        this.$eventsReset = $( '#events-reset' );

        this.$cmdPanelMask = $( '#cmd-panel-mask' );
        this.$loader = $( '#loader' );

        this.eventsStorage = new EventsStorage( EventsStorage.getFromLocalStorage() )
    }

    start(): void {
        this.$eventAdd.on( 'click', this.onAddEvent.bind( this ) );
        this.initMap();
    }

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

    initMap(): void {
        const mapOptions: MapboxOptions = {
            center: config.api.mapboxgl.center as LngLatLike,
            container: 'map',
            style: 'mapbox://styles/mapbox/outdoors-v11',
            zoom: config.api.mapboxgl.zoom as number
        };

        mapboxgl.accessToken = config.api.mapboxgl.accessToken;
        this.map = new mapboxgl.Map( mapOptions );
        this.map.on('load', this.onMapLoad.bind(this));
    }

    renderMarker( eventData: EventData ): void {
        const
            popup: Popup = new mapboxgl.Popup({
                className: 'map-popup',
                maxWidth: '300px',
                offset: 50
            }),
            dateString: string = ' du '
                + EventData.getProperDate(eventData.date_start) + ' au '
                + EventData.getProperDate(eventData.date_end),
            titleFull: string = eventData.title + dateString;


        popup.setHTML(`
            <div class="popup-inner">
                <div class="popup-title">${ eventData.title }</div>
                <div class="popup-date">${ dateString }</div>
                <div class="popup-description">${eventData.description}</div>
            </div>
        `);

        const $marker: JQuery = $( `<div class="map-marker flag-green" title="${ titleFull }">` );
        const marker: Marker = new mapboxgl.Marker({
            element: $marker.get(0)
        });

        marker
            .setLngLat( eventData.lngLat )
            .setPopup( popup )
            .addTo( this.map as Map );
    }

    onAddEvent(): void {
        const
            newTitle = this.$eventTitle.val() as string,
            newDescription = this.$eventDescription.val() as string,
            newDateStartString = this.$eventDateStart.val() as string,
            newDateEndString = this.$eventDateEnd.val() as string;

        if( ! this.checkAddEventFields( newTitle, newDescription, newDateStartString, newDateEndString ) ) return;

        let
            newDateStart = new Date( newDateStartString ) as Date,
            newTimeStart = this.$eventTimeStart.val() as string,
            arrTimeStart = newTimeStart.split(':') as Array<string>,
            newDateEnd = new Date( newDateEndString as string ) as Date,
            newTimeEnd = this.$eventTimeEnd.val() as string,
            arrTimeEnd = newTimeEnd.split(':') as Array<string>;

        newDateStart.setHours(
            parseInt( arrTimeStart[0], 10 ),
            parseInt( arrTimeStart[1], 10 )
        );
        newDateEnd.setHours(
            parseInt( arrTimeEnd[0], 10 ),
            parseInt( arrTimeEnd[1], 10 )
        );

        if( !this.checkAddEventDates( newDateStart, newDateEnd ) ) return;

        this.newEvent = new EventData(
            newTitle,
            newDescription,
            newDateStart,
            newDateEnd
        );

        this.$cmdPanelMask.show();
        this.map.once( 'click', this.onAddEventMapPick.bind(this) );
    }

    onAddEventMapPick( event: any ): void {
        this.newEvent.lngLat = {
            lng: event.lngLat.lng,
            lat: event.lngLat.lat
        };

        this.eventsStorage.add( this.newEvent );
        this.eventsStorage.saveToLocalStorage();
        this.renderMarker( this.newEvent );

        delete this.newEvent;

        this.resetFormFields();
        this.$cmdPanelMask.hide();
    }

    onMapLoad(): void {
        this.map.resize();

        for( let eventData of this.eventsStorage.data ) {
            this.renderMarker( eventData );
        }
        this.$loader.fadeOut();
    }

    resetFormFields() {
        this.$eventTitle.val( '' );
        this.$eventDescription.val( '' );
        this.$eventDateStart.val( '' );
        this.$eventTimeStart.val('12:00');
        this.$eventDateEnd.val( '' );
        this.$eventTimeEnd.val('12:00');
    }
}

const app = new App;
export default app;

