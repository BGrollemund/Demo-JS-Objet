import {Marker} from "mapbox-gl";

/**
 * Colored Marker interface
 */
export default interface IColoredMarker {
    color: string;
    marker: Marker;
}