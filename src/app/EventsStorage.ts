import config from '../../app.config.json';

import EventData from "./EventData";

/**
 * Nom de la clé de localStorage à utiliser pour l'enregistrement / récupération
 * Key name in localStorage, used to save and obtain data
 *
 * @type {string}
 */
const localStorageName: string = 'events-storage';

/**
 * Data events storage object
 */
export default class EventsStorage {
    public data: Array<EventData>;

    constructor( jsonData: IEventsStorage | null = null ) {
        this.data = jsonData ? jsonData.data : [];
    }

    /**
     * Get data avaliable in localStorage (static)
     */
    static getFromLocalStorage(): IEventsStorage | null {
        const storageData: string | null = localStorage.getItem( localStorageName );

        if( !storageData ) return null;

        let result: IEventsStorage = JSON.parse( storageData );

        result.data.forEach( ( el: EventData, i: number ) => {
            result.data[i].date_start = new Date(el.date_start);
            result.data[i].date_end = new Date(el.date_end);
        });

        return result;
    }

    /**
     * Add a event in EventsStorage
     *
     * @param data
     */
    add( data: EventData ): void {
        this.data.push( data );
    }

    /**
     * Delete a event in EventsStorage by index
     *
     * @param i
     */
    deleteByIndex( i : number ): void {
        this.data.splice( i, 1 );
    }


    /**
     * Edit EventData place in index i in EventsStorage.data
     *
     * @param i
     * @param eventData
     */
    editByIndex( i: number, eventData: EventData ): void {
        this.data.splice( i, 1, eventData );
    }

    /**
     * Fixtures: put data (available in config) in localStorage
     */
    fixturesLoad(): void {
        if( this.data.length <= 0 ) {
            localStorage.setItem( localStorageName, JSON.stringify( config.fixtures ) );
        }
    }

    /**
     * Reset EventsStorage and localStorage
     */
    reset(): void {
        this.data = [];
        localStorage.removeItem(localStorageName);
    }

    /**
     * Save EventsStorage date in localStorage with a serialized JSON
     */
    saveToLocalStorage(): void {
        localStorage.setItem( localStorageName, JSON.stringify( this ) );
    }

    /**
     * Magic method used to serialize
     */
    toJson(): EventsStorage {
        return  {
            data: this.data
        } as IEventsStorage;
    }
}

export interface IEventsStorage extends EventsStorage {}