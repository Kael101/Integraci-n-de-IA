import React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { Sparkles } from 'lucide-react';

const MuralMarkers = ({ stations, unlockedStations, onMarkerClick }) => {
    return (
        <>
            {stations.map(station => {
                const isUnlocked = unlockedStations.includes(station.id);
                return (
                    <Marker
                        key={station.id}
                        longitude={station.location.lng}
                        latitude={station.location.lat}
                        anchor="bottom"
                        onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            onMarkerClick(station);
                        }}
                    >
                        <div className="flex flex-col items-center group cursor-pointer">
                            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${isUnlocked ? 'bg-jaguar-500 border-white text-black' : 'bg-black/60 border-jaguar-500 text-jaguar-500'}`}>
                                <Sparkles size={16} className={!isUnlocked ? 'animate-pulse' : ''} />
                            </div>
                            <span className="bg-black/70 text-white text-[9px] px-2 py-0.5 rounded-full backdrop-blur mt-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {station.name}
                            </span>
                        </div>
                    </Marker>
                );
            })}
        </>
    );
};

export default MuralMarkers;
