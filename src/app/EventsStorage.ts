import EventData from "./EventData";

const localStorageName: string = 'events-storage';

export default class EventsStorage {
    public data: Array<EventData>;

    constructor( jsonData: IEventsStorage | null = null ) {
        this.data = jsonData ? jsonData.data : [];
    }

    add( data: EventData ): void {
        this.data.push( data );
    }

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

    saveToLocalStorage(): void {
        localStorage.setItem( localStorageName, JSON.stringify( this ) );
    }

    toJson(): EventsStorage {
        return  {
            data: this.data
        } as IEventsStorage;
    }
}

export interface IEventsStorage extends EventsStorage {}