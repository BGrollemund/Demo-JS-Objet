import config from '../../app.config.json';

import jQuery from 'jquery';
import mapboxgl, {LngLatLike, Map, MapboxOptions, Marker, Popup} from "mapbox-gl";

import EventsStorage from "./EventsStorage";
import EventData from "./EventData";
import IColoredMarker from "./IColoredMarker";

const $: JQueryStatic = jQuery;

class App {
    // Boutons tableaux de commandes
    public $eventAdd: JQuery;
    public $eventsReset: JQuery;
    public $eventsFilter: JQuery;

    // Champs Formulaires: ajout évènement
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

    // Champs Filtres: marqueurs selon la couleur
    public $markerGreen: JQuery;
    public $markerOrange: JQuery;
    public $markerBlue: JQuery;
    public $markerRed: JQuery;

    // Masques
    public $cmdPanelMask: JQuery;
    public $loader: JQuery;

    // Boutons carte
    public $cmdNature: JQuery;
    public $cmdReload: JQuery;
    public $cmdRecenter: JQuery;
    public $cmdSatellite: JQuery;


    public eventsStorage: EventsStorage;
    public map: Map;
    public newEvent: EventData;
    public placeMarkers: IColoredMarker[];

    constructor() {
        this.$eventAdd = $( '#event-add' );
        this.$eventsFilter = $( '#events-filter' );
        this.$eventsReset = $( '#events-reset' );

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

        this.$cmdPanelMask = $( '#cmd-panel-mask' );
        this.$loader = $( '#loader' );

        this.$cmdNature = $( '#cmd-nature' );
        this.$cmdReload = $( '#cmd-reload' );
        this.$cmdRecenter = $( '#cmd-recenter' );
        this.$cmdSatellite = $( '#cmd-satellite' );

        this.eventsStorage = new EventsStorage( EventsStorage.getFromLocalStorage() );
        this.placeMarkers = [];
    }

    start(): void {
        // Chargement des fixtures
        this.eventsStorage.fixturesLoad();
        this.eventsStorage = new EventsStorage( EventsStorage.getFromLocalStorage() );

        this.initMap();
        this.$eventAdd.on( 'click', this.onAddEvent.bind( this ) );
        this.$eventsReset.on( 'click', this.onResetEvents.bind( this ) );
        this.$eventsFilter.on( 'click', this.onFilterEvents.bind( this ) );

        this.$cmdNature.on( 'click', this.onNatureMap.bind(this) );
        this.$cmdReload.on( 'click', this.onReloadMarkers.bind(this) );
        this.$cmdRecenter.on( 'click', this.onRecenterMap.bind(this) );
        this.$cmdSatellite.on( 'click', this.onSatelliteMap.bind(this) );
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

    findMarkerInfosByDate( eventData: EventData ): Array<string> {
        let result = [];

        const diffStartDateNow: number = eventData.date_start.getTime() - Date.now();
        const diffEndDateNow: number = eventData.date_end.getTime() - Date.now();

        if( diffStartDateNow > 0 ) {
            const diffDaysStartDateNow: number = diffStartDateNow / 86400000;
            if( diffDaysStartDateNow >= 3 ) {
                result.push( 'green', '' )
            }
            else {
                const diffHoursStartDateNow: number = ( diffDaysStartDateNow - Math.floor( diffDaysStartDateNow ) ) / ( 1/24 );

                result.push( 'orange',
                    'Attention, commence dans '
                    + Math.floor( diffDaysStartDateNow )
                    + ' jours et '
                    + Math.floor( diffHoursStartDateNow )
                    + ' heures'
                )
            }
        }
        else {
            if( diffEndDateNow < 0 ) {
                result.push( 'red', 'Quel dommage ! Vous avez raté cet événement !' );
            }
            else {
                result.push( 'blue', 'L\'évènement est en cours !' )
            }
        }

        return result;
    }

    renderMarker( eventData: EventData ): void {
        const
            popup: Popup = new mapboxgl.Popup({
                className: 'map-popup',
                maxWidth: '400px',
                offset: 50
            }),
            dateString: string = ' du '
                + EventData.getProperDate(eventData.date_start) + ' au '
                + EventData.getProperDate(eventData.date_end),
            titleFull: string = eventData.title + dateString,
            infosMarker = this.findMarkerInfosByDate( eventData );

        popup.setHTML(`
            <div class="popup-inner">
                <div class="popup-alert">${ infosMarker[1] }</div>
                <div class="popup-title">${ eventData.title }</div>
                <div class="popup-date">${ dateString }</div>
                <div class="popup-description">${eventData.description}</div>
                <div class="btns-popup">
                    <div class="btn-popup" id="event-edit"><span>🖊️</span></div>
                    <div class="btn-popup" id="event-delete"><span>❌</span></div>
                </div>
            </div>
        `);

        const $marker: JQuery = $( `<div class="map-marker flag-${ infosMarker[0] }" title="${ titleFull }">` );
        const marker: Marker = new mapboxgl.Marker({
            element: $marker.get(0)
        });

        marker
            .setLngLat( eventData.lngLat )
            .setPopup( popup )
            .addTo( this.map as Map );

        this.placeMarkers.push( {
                marker: marker,
                color: infosMarker[0]
            });
    }

    onAddEvent(): void {
        const
            newTitle = this.$eventTitle.val() as string,
            newDescription = this.$eventDescription.val() as string,
            newDateStartString = this.$eventDateStart.val() as string,
            newDateEndString = this.$eventDateEnd.val() as string;

        if( ! this.checkAddEventFields( newTitle, newDescription, newDateStartString, newDateEndString ) ) return;

        const
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

    onFilterEvents(): void {
        const
            markerGreen = this.$markerGreen.is(':checked'),
            markerOrange = this.$markerOrange.is(':checked'),
            markerBlue = this.$markerBlue.is(':checked'),
            markerRed = this.$markerRed.is(':checked');

        for( let eventData of this.eventsStorage.data ) {
            this.renderMarker( eventData );
        }

        for( let coloredMarker of this.placeMarkers ) {
            if( !markerGreen && coloredMarker.color === 'green' ) coloredMarker.marker.remove();
            if( !markerOrange && coloredMarker.color === 'orange' ) coloredMarker.marker.remove();
            if( !markerBlue && coloredMarker.color === 'blue' ) coloredMarker.marker.remove();
            if( !markerRed && coloredMarker.color === 'red' ) coloredMarker.marker.remove();
        }
    }

    onMapLoad(): void {
        this.map.resize();

        for( let eventData of this.eventsStorage.data ) {
            this.renderMarker( eventData );
        }
        this.$loader.fadeOut();
    }

    onNatureMap(): void {
        this.$loader.show();
        this.map.setStyle( 'mapbox://styles/mapbox/outdoors-v11' );
        this.map.on('idle', () => this.$loader.fadeOut() );
    }

    onRecenterMap(): void {
        this.map.setCenter( [ config.api.mapboxgl.center[0], config.api.mapboxgl.center[1] ] );
        this.map.setZoom( config.api.mapboxgl.zoom );
    }

    onSatelliteMap(): void {
        this.$loader.show();
        this.map.setStyle( 'mapbox://styles/mapbox/satellite-streets-v11' );
        this.map.on('idle', () => this.$loader.fadeOut() );
    }

    onReloadMarkers(): void {
        for( let coloredMarker of this.placeMarkers ) {
            coloredMarker.marker.remove();
        }

        for( let eventData of this.eventsStorage.data ) {
            this.renderMarker( eventData );
        }
    }

    onResetEvents(): void {
        this.eventsStorage.resetLocalStorage();
        for( let coloredMarker of this.placeMarkers ) {
            coloredMarker.marker.remove();
        }
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

