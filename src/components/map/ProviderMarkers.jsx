import React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import CustomMarker from '../CustomMarker';

const ProviderMarkers = ({ providers, onNavigate }) => {
    return (
        <>
            {providers.map(p => (
                <Marker
                    key={p.id}
                    longitude={p.geometry.coordinates[0]}
                    latitude={p.geometry.coordinates[1]}
                    anchor="bottom"
                    onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        onNavigate(p);
                    }}
                >
                    <CustomMarker
                        category={p.properties.category === 'Artesanía' ? 'artisan' : (p.properties.category === 'Alojamiento' ? 'lodging' : 'guide')}
                        label={p.properties.name}
                    />
                </Marker>
            ))}
        </>
    );
};

export default ProviderMarkers;
