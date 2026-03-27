"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { ListingCard } from "@/components/ListingCard";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface Listing {
  _id: string;
  title: string;
  pricePerDay: number;
  locationName?: string;
  images?: string[];
  category?: { image: string; slug: string } | string;
  location?: { coordinates: [number, number] };
}

interface ListingCardProps {
  image: string;
  title: string;
  price: number;
  location: string;
  rating: number;
  reviews: number;
}

interface BoundsData {
  neLat: number;
  neLng: number;
  swLat: number;
  swLng: number;
}

interface MapViewProps {
  listings?: Listing[];
  onBoundsChange?: (bounds: BoundsData) => void;
  hoveredId?: string | null;
  onHoverChange?: (id: string | null) => void;
  onMarkerClick?: (id: string) => void;
  onMarkerDoubleClick?: (id: string) => void;
  hoveredListing?: Listing | null;
  focusCenter?: [number, number] | null;
  focusZoom?: number;
}

export default function MapView(props: MapViewProps) {
  const {
    listings = [],
    onBoundsChange,
    hoveredId,
    onHoverChange,
    onMarkerClick,
    onMarkerDoubleClick,
    hoveredListing,
    focusCenter,
    focusZoom = 11,
  } = props || {};
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const getThemeColor = useCallback((cssVar: string, fallback: string) => {
    if (typeof window === "undefined") return fallback;
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(cssVar)
        .trim() || fallback
    );
  }, []);

  const applyMapTheme = useCallback(
    (map: mapboxgl.Map) => {
      const textPrimary = getThemeColor("--color-text-primary", "#2d3435");
      const labelHalo = getThemeColor("--color-background", "#f9f9f9");

      try {
        map.setPaintProperty("water", "fill-color", "#cacaca");
      } catch {}

      const layers = map.getStyle().layers ?? [];
      for (const layer of layers) {
        if (layer.type !== "symbol") continue;

        const id = layer.id.toLowerCase();
        const isMajorLabel =
          id.includes("country") ||
          id.includes("state") ||
          id.includes("settlement");

        try {
          map.setPaintProperty(layer.id, "text-color", textPrimary);
          map.setPaintProperty(layer.id, "text-halo-color", labelHalo);
          map.setPaintProperty(
            layer.id,
            "text-halo-width",
            isMajorLabel ? 1.2 : 1.0,
          );
          map.setPaintProperty(layer.id, "text-halo-blur", 0.4);
        } catch {}
      }
    },
    [getThemeColor],
  );

  const mapListingToCard = (listing: Listing): ListingCardProps => {
    const fallbackImages: Record<string, string> = {
      stroller: "TinyTribe/CategoryPlaceholders/stroller",
      carrier: "TinyTribe/CategoryPlaceholders/carrier",
      car_seat: "TinyTribe/CategoryPlaceholders/car_seat",
      travel_cot: "TinyTribe/CategoryPlaceholders/travel_cot",
      highchair: "TinyTribe/CategoryPlaceholders/highchair",
      bouncer: "TinyTribe/CategoryPlaceholders/bouncer",
      monitor: "TinyTribe/CategoryPlaceholders/monitor",
      bike_trailer: "TinyTribe/CategoryPlaceholders/bike_trailer",
      toy: "TinyTribe/CategoryPlaceholders/toy",
    };

    const category = listing.category;

    const categoryImage =
      category && typeof category === "object" ? category.image : null;

    const categorySlug =
      category && typeof category === "object" ? category.slug : null;

    const validListingImage = Array.isArray(listing.images)
      ? (listing.images.find(
          (image): image is string =>
            typeof image === "string" && image.trim().length > 0,
        ) ?? null)
      : null;

    const image =
      validListingImage ||
      categoryImage ||
      (categorySlug ? fallbackImages[categorySlug] : null) ||
      fallbackImages["stroller"];

    return {
      image,
      title: listing.title,
      price: listing.pricePerDay,
      location: listing.locationName || "",
      rating: 4.8,
      reviews: Math.floor(Math.random() * 50) + 5,
    };
  };

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/light-v10",
        center: [10.0, 53.55],
        zoom: 10,
      });

      mapInstance.current.on("load", () => {
        const map = mapInstance.current;
        if (!map) return;

        applyMapTheme(map);
      });
    }

    const map = mapInstance.current;
    if (!map) return;

    const anyMap = map as unknown as Record<string, boolean>;
    if (!anyMap._boundsListenerAdded && onBoundsChange) {
      anyMap._boundsListenerAdded = true;

      let timeout: ReturnType<typeof setTimeout>;
      let lastBounds: BoundsData | null = null;

      const triggerFetch = () => {
        const bounds = map.getBounds();
        if (!bounds) return;

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        const currentBounds = {
          neLat: ne.lat,
          neLng: ne.lng,
          swLat: sw.lat,
          swLng: sw.lng,
        };

        // Only trigger if bounds actually changed meaningfully
        if (lastBounds) {
          const threshold = 0.01; // ~1km, tweak if needed

          const hasMovedEnough =
            Math.abs(lastBounds.neLat - currentBounds.neLat) > threshold ||
            Math.abs(lastBounds.neLng - currentBounds.neLng) > threshold ||
            Math.abs(lastBounds.swLat - currentBounds.swLat) > threshold ||
            Math.abs(lastBounds.swLng - currentBounds.swLng) > threshold;

          if (!hasMovedEnough) return;
        }

        lastBounds = currentBounds;

        onBoundsChange(currentBounds);
      };

      // Fire once when map finishes loading
      map.on("load", () => {
        triggerFetch();
      });

      if (map.loaded()) {
        triggerFetch();
      }

      // Fire on movement (debounced)
      map.on("moveend", () => {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
          triggerFetch();
        }, 300);
      });
    }

    // Track existing markers by listing id
    const existingMarkers = new Map<string, mapboxgl.Marker>();

    markersRef.current.forEach((marker) => {
      const markerData = marker as unknown as Record<string, unknown>;
      if (markerData.__listingId) {
        existingMarkers.set(markerData.__listingId as string, marker);
      }
    });

    const newMarkers: mapboxgl.Marker[] = [];

    const safeListings = Array.isArray(listings) ? listings : [];

    safeListings.forEach((l: Listing) => {
      const id = l._id;
      const coords = l.location?.coordinates;

      if (!coords || coords.length !== 2) return;

      const lng = Number(coords[0]);
      const lat = Number(coords[1]);

      // Reuse marker if it already exists
      if (existingMarkers.has(id)) {
        const existing = existingMarkers.get(id)!;

        // Rebind hover events (important for reused markers)
        const existingData = existing as unknown as Record<string, unknown>;
        const el = existingData.__el as HTMLElement;
        if (el) {
          let leaveTimeout: ReturnType<typeof setTimeout>;

          el.onmouseenter = () => {
            clearTimeout(leaveTimeout);
            if (onHoverChange) onHoverChange(id);
          };

          el.onclick = () => {
            if (onMarkerClick) onMarkerClick(id);
          };

          el.ondblclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (onMarkerDoubleClick) onMarkerDoubleClick(id);
          };

          el.onmouseleave = () => {
            leaveTimeout = setTimeout(() => {
              if (onHoverChange) onHoverChange(null);
            }, 80);
          };
        }

        newMarkers.push(existing);
        existingMarkers.delete(id);
        return;
      }

      // Create new marker
      const el = document.createElement("div");

      const price = l.pricePerDay ?? 0;

      let bg = "#F3F4F4";
      let text = "#203435";

      if (price <= 10) {
        bg = "#F3F4F4";
        text = "#5E5E67";
      } else if (price <= 20) {
        bg = "#E8ECEB";
        text = "#203435";
      } else if (price <= 30) {
        bg = "#A4B5AC";
        text = "#FFFFFF";
      } else {
        bg = "#506358";
        text = "#FFFFFF";
      }

      el.style.background = bg;
      el.style.color = text;
      el.style.fontSize = "13px";
      el.style.fontWeight = "600";
      el.style.padding = "6px 10px";
      el.style.borderRadius = "999px";
      el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      el.style.border = "1px solid rgba(0,0,0,0.05)";
      el.style.whiteSpace = "nowrap";
      el.style.pointerEvents = "auto";
      el.className = "price-marker";
      el.style.cursor = "pointer";
      el.style.display = "inline-block";

      let leaveTimeout: ReturnType<typeof setTimeout>;

      el.onmouseenter = () => {
        clearTimeout(leaveTimeout);
        if (onHoverChange) onHoverChange(id);
      };

      el.onclick = () => {
        if (onMarkerClick) onMarkerClick(id);
      };

      el.ondblclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (onMarkerDoubleClick) onMarkerDoubleClick(id);
      };

      el.onmouseleave = () => {
        leaveTimeout = setTimeout(() => {
          if (onHoverChange) onHoverChange(null);
        }, 80);
      };

      el.innerText = new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(price);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "bottom",
        offset: [0, -10],
      })
        .setLngLat([lng, lat])
        .addTo(map);

      const markerData = marker as unknown as Record<string, unknown>;
      markerData.__listingId = id;
      markerData.__el = el;

      newMarkers.push(marker);
    });

    existingMarkers.forEach((marker) => marker.remove());

    markersRef.current = newMarkers;
  }, [
    applyMapTheme,
    listings,
    onBoundsChange,
    onHoverChange,
    onMarkerClick,
    onMarkerDoubleClick,
  ]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !focusCenter) return;

    map.flyTo({
      center: focusCenter,
      zoom: focusZoom,
      essential: true,
    });
  }, [focusCenter, focusZoom]);

  useEffect(() => {
    markersRef.current.forEach((marker) => {
      const markerData = marker as unknown as Record<string, unknown>;
      const el = markerData.__el as HTMLElement;
      if (!el) return;

      if (markerData.__listingId === hoveredId) {
        el.style.zIndex = "20";
        el.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
        el.style.filter = "brightness(0.9)";
      } else {
        el.style.zIndex = "1";
        el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
        el.style.filter = "brightness(1)";
      }
    });
  }, [hoveredId]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Remove existing popup if any
    const mapData = map as unknown as Record<string, unknown>;
    if (mapData.__hoverPopup) {
      const popup = mapData.__hoverPopup as mapboxgl.Popup;
      popup.remove();
      mapData.__hoverPopup = null;
    }

    if (!hoveredListing) return;

    const coords = hoveredListing.location?.coordinates;
    if (!coords || coords.length !== 2) return;

    const popupNode = document.createElement("div");
    popupNode.style.pointerEvents = "none";

    const root = createRoot(popupNode);
    root.render(
      <div style={{ width: "240px" }}>
        <ListingCard {...mapListingToCard(hoveredListing)} />
      </div>,
    );

    // DEBUG: force visible background
    popupNode.style.zIndex = "9999";

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 25,
      className: "custom-popup",
    })
      .setLngLat([coords[0], coords[1]])
      .setDOMContent(popupNode)
      .addTo(map);

    mapData.__hoverPopup = popup;

    return () => {
      const currentMapData = mapInstance.current as unknown as Record<
        string,
        unknown
      >;
      if (currentMapData.__hoverPopup) {
        const currentPopup = currentMapData.__hoverPopup as mapboxgl.Popup;
        currentPopup.remove();
        currentMapData.__hoverPopup = null;
      }
    };
  }, [hoveredListing]);

  if (
    typeof window !== "undefined" &&
    !document.getElementById("price-marker-styles")
  ) {
    const style = document.createElement("style");
    style.id = "price-marker-styles";
    style.innerHTML = `
      .price-marker {
        transition: box-shadow 0.15s ease, filter 0.15s ease;
      }

      .price-marker:hover {
        box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        z-index: 10;
      }

      .mapboxgl-popup {
        z-index: 9999 !important;
      }

      .mapboxgl-popup-content {
        padding: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  return <div ref={mapRef} className="w-full h-full" />;
}
