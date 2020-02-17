import config from '../../app.config.json';

import jQuery from 'jquery';
const $: JQueryStatic = jQuery;

import mapboxgl, { LngLatLike, Map, MapboxOptions, MapMouseEvent, Marker, Popup } from "mapbox-gl";

import {Calendar, RenderDayCellEventArgs} from '@syncfusion/ej2-calendars';
import { loadCldr, L10n } from '@syncfusion/ej2-base';

import EventsStorage from "./EventsStorage";
import EventData from "./EventData";
import IColoredMarker from "./IColoredMarker";
import formFieldsManager from "./FormFieldsManager";

class App {
    public $cmdPanel: JQuery;
    public $cmdMap: JQuery;
    public $cmdPanelMask: JQuery;
    public $loader: JQuery;
    public $positionMsg: JQuery;

    public calendar: Calendar;
    public currentMarkerIndex: number;
    public currentMarkerPosition: LngLatLike;
    public eventsStorage: EventsStorage;
    public map: Map;
    public newEvent: EventData;
    public placeMarkers: IColoredMarker[];

    constructor() {
        this.$cmdPanel = $('#cmd-panel');
        this.$cmdMap = $( '#cmd-map' );
        this.$cmdPanelMask = $( '#cmd-panel-mask' );
        this.$loader = $( '#loader' );
        this.$positionMsg = $( '#position-msg' );

        this.eventsStorage = new EventsStorage( EventsStorage.getFromLocalStorage() );
        this.placeMarkers = [];
    }

    start(): void {
        // Load fixtures
        this.eventsStorage.fixturesLoad();
        this.eventsStorage = new EventsStorage( EventsStorage.getFromLocalStorage() );

        // Initialize calendar
        this.initCalendar();

        // Initialize map
        this.initMap();

        // Initialize listeners
        this.$cmdPanel.on( 'click', this.onCmdPanel.bind( this ) );
        this.$cmdMap.on( 'click', this.onCmdMap.bind(this) );
    }

    // ---- Commands panel ---- //

    /**
     * Command panel manager listener
     *
     * @param event
     */
    onCmdPanel( event: MouseEvent ): void {
        const eventTarget: HTMLDivElement = event.target as HTMLDivElement;

        if( eventTarget.classList.contains('event-add') ) this.onAddEvent();
        if( eventTarget.classList.contains('event-edit') ) this.onEditEvent();
        if( eventTarget.classList.contains('event-edit-position') ) this.onEditEventPosition();
        if( eventTarget.classList.contains('event-edit-cancel') ) this.onEditEventCancel();
        if( eventTarget.classList.contains('events-reset') ) this.onResetEvents();
        if( eventTarget.classList.contains('events-filter') ) this.onFilterEvents();
    }

    // Add event

    /**
     * Create a new EventData from form data (without position)
     *
     * @return EventData | null
     */
    createEventFromFormData(): EventData | null {
        const
            newTitle = formFieldsManager.$eventTitle.val() as string,
            newDescription = formFieldsManager.$eventDescription.val() as string,
            newDateStartString = formFieldsManager.$eventDateStart.val() as string,
            newDateEndString = formFieldsManager.$eventDateEnd.val() as string;

        if( ! formFieldsManager.checkAddEventFields( newTitle, newDescription, newDateStartString, newDateEndString ) ) return null;

        const
            newDateStart = new Date( newDateStartString ) as Date,
            newTimeStart = formFieldsManager.$eventTimeStart.val() as string,
            arrTimeStart = newTimeStart.split(':') as Array<string>,
            newDateEnd = new Date( newDateEndString as string ) as Date,
            newTimeEnd = formFieldsManager.$eventTimeEnd.val() as string,
            arrTimeEnd = newTimeEnd.split(':') as Array<string>;

        newDateStart.setHours(
            parseInt( arrTimeStart[0], 10 ),
            parseInt( arrTimeStart[1], 10 )
        );
        newDateEnd.setHours(
            parseInt( arrTimeEnd[0], 10 ),
            parseInt( arrTimeEnd[1], 10 )
        );

        if( ! formFieldsManager.checkAddEventDates( newDateStart, newDateEnd ) ) return null;

        return new EventData(
            newTitle,
            newDescription,
            newDateStart,
            newDateEnd
        );
    }

    /**
     * Add event infos listener
     */
    onAddEvent(): void {
        const newEvent: EventData | null = this.createEventFromFormData();

        if( ! newEvent ) return;

        this.newEvent = newEvent;

        this.$cmdPanelMask.show();
        this.map.once( 'click', this.onAddEventMapPick.bind(this) );
    }

    /**
     * Add event position listener by picking postion on map
     *
     * @param event
     */
    onAddEventMapPick( event: MapMouseEvent ): void {
        this.newEvent.lngLat = event.lngLat;

        this.eventsStorage.add( this.newEvent );
        this.eventsStorage.saveToLocalStorage();
        this.calendar.refresh();
        this.renderMarker( this.newEvent );

        formFieldsManager.resetEventFields();
        this.$cmdPanelMask.hide();
    }

    // Edit event

    /**
     * Edit event listener
     */
    onEditEvent(): void {
        const editEvent: EventData | null = this.createEventFromFormData();

        if( ! editEvent ) return;

        editEvent.lngLat = this.currentMarkerPosition;

        this.eventsStorage.editByIndex( this.currentMarkerIndex, editEvent );
        this.eventsStorage.saveToLocalStorage();
        this.placeMarkers[this.currentMarkerIndex].marker.remove();
        this.placeMarkers.splice( this.currentMarkerIndex, 1 );
        this.renderMarker( editEvent );
        formFieldsManager.resetEventFields();
        this.calendar.refresh();
        $('.add').show();
        $('.edit').hide();
        this.$positionMsg.text('');
    }

    /**
     * Cancel edit event listener
     */
    onEditEventCancel(): void {
        formFieldsManager.resetEventFields();
        $('.add').show();
        $('.edit').hide()
        this.$positionMsg.text('');
    }

    /**
     * Edit event position listener
     */
    onEditEventPosition(): void {
        this.$cmdPanelMask.show();
        this.map.once( 'click', this.onEditEventPositionMapPick.bind(this) );
    }

    /**
     * Pick position on map and put in currentMarkerPosition
     *
     * @param event
     */
    onEditEventPositionMapPick( event: MapMouseEvent ): void {
        this.currentMarkerPosition = event.lngLat;
        this.$positionMsg.html('Vous avez changé la position.<br> Appuyez sur "Editer" pour confirmer.');
        this.$cmdPanelMask.hide();
    }

    // Reset events

    /**
     * Reset events listener
     */
    onResetEvents(): void {
        this.eventsStorage.reset();
        this.calendar.refresh();
        for( let coloredMarker of this.placeMarkers ) {
            coloredMarker.marker.remove();
        }
        this.placeMarkers = [];
    }

    // Filter events

    /**
     * Filter events by marker color listener
     */
    onFilterEvents(): void {
        const
            markerGreen = formFieldsManager.$markerGreen.is(':checked'),
            markerOrange = formFieldsManager.$markerOrange.is(':checked'),
            markerBlue = formFieldsManager.$markerBlue.is(':checked'),
            markerRed = formFieldsManager.$markerRed.is(':checked');

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

    // ---- Map ---- //

    /**
     * Init map
     */
    initMap(): void {
        const mapOptions: MapboxOptions = {
            center: config.api.mapboxgl.center as LngLatLike,
            container: 'map',
            style: config.api.mapboxgl.style.nature.link,
            zoom: config.api.mapboxgl.zoom
        };

        mapboxgl.accessToken = config.api.mapboxgl.accessToken;
        this.map = new mapboxgl.Map( mapOptions );
        this.map.on('load', this.onMapLoad.bind(this));
    }

    /**
     * Add markers on map
     */
    onMapLoad(): void {
        this.map.resize();

        for( let eventData of this.eventsStorage.data ) {
            this.renderMarker( eventData );
        }
        this.$loader.fadeOut();
    }

    // Marker

    /**
     * Display a marker
     *
     * @param eventData
     */
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
            <div id="popup-inner">
                <div class="popup-alert">${ infosMarker[1] }</div>
                <div class="popup-title">${ eventData.title }</div>
                <div class="popup-date">${ dateString }</div>
                <div class="popup-description">${eventData.description}</div>
                <div class="btns-popup">
                    <div class="btn-popup edit" id="event-edit"><span class="edit">🖊️</span></div>
                    <div class="btn-popup delete" id="event-delete"><span class="delete">🗑️</span></div>
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

        popup.on('open', this.onPopupOpen.bind( this, marker ));
    }

    /**
     * Find infos to add on a marker
     * result[0]: color
     * result[1]: info message
     *
     * @param eventData
     * @return Array<string>
     */
    findMarkerInfosByDate( eventData: EventData ): Array<string> {
        let result = [];

        const diffStartDateNow: number = eventData.date_start.getTime() - Date.now();
        const diffEndDateNow: number = eventData.date_end.getTime() - Date.now();

        if( diffStartDateNow > 0 ) {
            // 86400000 = milliseconds by day
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

    // Popup

    /**
     * Add listeners on popup (edit and delete event) when is open
     *
     * @param marker
     */
    onPopupOpen( marker: Marker ): void {
        const $popupInner: JQuery = $('#popup-inner');

        $popupInner.on('click', this.onCmdPopup.bind(this, marker));
    }

    /**
     * Command popup manager listener
     *
     * @param marker
     * @param event
     */
    onCmdPopup( marker: Marker, event: MouseEvent ) {
        const eventTarget: HTMLDivElement = event.target as HTMLDivElement;

        if( eventTarget.classList.contains('delete') ) {
            for( let i=0; i<this.placeMarkers.length; i++ ) {
                if( this.placeMarkers[i].marker === marker ) {
                    this.placeMarkers.splice( i, 1 );
                    this.eventsStorage.deleteByIndex( i );
                    this.eventsStorage.saveToLocalStorage();
                    this.calendar.refresh();
                    marker.remove();
                    return;
                }
            }
        }

        if( eventTarget.classList.contains('edit') ) {
            for( let i=0; i<this.placeMarkers.length; i++ ) {
                if( this.placeMarkers[i].marker === marker ) {
                    marker.getPopup().remove();
                    $('.add').hide();
                    $('.edit').show();
                    formFieldsManager.setEditEventFields(this.eventsStorage.data[i]);
                    this.currentMarkerIndex = i;
                    this.currentMarkerPosition = this.eventsStorage.data[i].lngLat;
                    return;
                }
            }
        }
    }

    // ---- Map Menu ---- //

    /**
     * Command map manager listener
     *
     * @param event
     */
    onCmdMap( event: MouseEvent ): void {
        const eventTarget: HTMLDivElement = event.target as HTMLDivElement;

        if( eventTarget.classList.contains('cmd-reload') ) this.onReloadMarkers();
        if( eventTarget.classList.contains('cmd-recenter') ) this.onRecenterMap();
        if( eventTarget.classList.contains('cmd-satellite') ) this.onSatelliteMap();
        if( eventTarget.classList.contains('cmd-nature') ) this.onNatureMap();
    }

    /**
     * Change style map in natural style
     */
    onNatureMap(): void {
        if( this.map.getStyle().name !== config.api.mapboxgl.style.nature.name ) {
            this.$loader.show();
            this.map.setStyle( config.api.mapboxgl.style.nature.link );
            this.map.on('idle', () => this.$loader.fadeOut() );
        }
    }

    /**
     * Center map on initial center and zoom (available in config)
     */
    onRecenterMap(): void {
        this.map.setCenter( [ config.api.mapboxgl.center[0], config.api.mapboxgl.center[1] ] );
        this.map.setZoom( config.api.mapboxgl.zoom );
    }

    /**
     * Reload markers (possible change in markers color)
     */
    onReloadMarkers(): void {
        for( let coloredMarker of this.placeMarkers ) {
            coloredMarker.marker.remove();
        }

        for( let eventData of this.eventsStorage.data ) {
            this.renderMarker( eventData );
        }
    }

    /**
     * Change style map in satellite style
     */
    onSatelliteMap(): void {
        if( this.map.getStyle().name !== config.api.mapboxgl.style.satellite.name ) {
            this.$loader.show();
            this.map.setStyle( config.api.mapboxgl.style.satellite.link );
            this.map.on('idle', () => this.$loader.fadeOut() );
        }
    }

    // ---- Calendar ----

    /**
     * Init calendar
     */
    initCalendar(): void {
        // Import french style for calendar
        loadCldr(
            require('cldr-data/supplemental/numberingSystems.json'),
            require('cldr-data/main/fr/ca-gregorian.json'),
            require('cldr-data/main/fr/numbers.json'),
            require('cldr-data/main/fr/timeZoneNames.json'),
            require('cldr-data/supplemental/weekdata.json')
        );

        L10n.load({
            'fr': {
                'calendar': { today: '' }
            }
        });

        // Create calendar
        this.calendar = new Calendar( {
            renderDayCell: this.setDaysSelectedToCalendar.bind(this),
            locale: 'fr'
        });

        this.calendar.appendTo('#calendar');
    }

    /**
     * Set style on days selected in the calendar
     *
     * @param day
     */
    setDaysSelectedToCalendar( day: RenderDayCellEventArgs ): void {
        // Disabled possibility for user to select a day
        day.isDisabled = true;

        // Make style in day with event
        if( day.date ) {
            for( let eventData of this.eventsStorage.data ) {
               if( day.element && EventData.containsDate( eventData, day.date ) ) day.element.classList.add( 'circle-red' );
            }
        }
    }
}

const app = new App;
export default app;

