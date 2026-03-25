"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { ListingCard } from "@/components/ListingCard";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function MapView(props: any) {
  const {
    listings = [],
    onBoundsChange,
    hoveredId,
    onHoverChange,
    hoveredListing,
  } = props || {};
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const mapListingToCard = (listing: any) => {
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

    const category: any = listing.category;

    const categoryImage =
      category && typeof category === "object" ? category.image : null;

    const categorySlug =
      category && typeof category === "object" ? category.slug : null;

    const validListingImage =
      listing.images?.[0] && listing.images[0].trim() !== ""
        ? listing.images[0]
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

        // Slight desaturation & soften
        map.setPaintProperty("water", "fill-color", "#E8ECEB");
      });
    }

    const map = mapInstance.current;
    if (!map) return;

    const anyMap = map as any;
    if (!anyMap._boundsListenerAdded && onBoundsChange) {
      anyMap._boundsListenerAdded = true;

      let timeout: ReturnType<typeof setTimeout>;
      let lastBounds: any = null;

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

    markersRef.current.forEach((marker: any) => {
      if (marker.__listingId) {
        existingMarkers.set(marker.__listingId, marker);
      }
    });

    const newMarkers: mapboxgl.Marker[] = [];

    const safeListings = Array.isArray(listings) ? listings : [];

    safeListings.forEach((l: any) => {
      const id = l._id;
      const coords = l.location?.coordinates;

      if (!coords || coords.length !== 2) return;

      const lng = Number(coords[0]);
      const lat = Number(coords[1]);

      // Reuse marker if it already exists
      if (existingMarkers.has(id)) {
        const existing = existingMarkers.get(id)!;

        // Rebind hover events (important for reused markers)
        const el = (existing as any).__el;
        if (el) {
          let leaveTimeout: any;

          el.onmouseenter = () => {
            clearTimeout(leaveTimeout);
            console.log("REUSED HOVER ENTER:", id);
            if (onHoverChange) onHoverChange(id);
          };

          el.onmouseleave = () => {
            leaveTimeout = setTimeout(() => {
              console.log("REUSED HOVER LEAVE:", id);
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

      let leaveTimeout: any;

      el.onmouseenter = () => {
        clearTimeout(leaveTimeout);
        console.log("HOVER ENTER MARKER:", id);
        if (onHoverChange) onHoverChange(id);
      };

      el.onmouseleave = () => {
        leaveTimeout = setTimeout(() => {
          console.log("HOVER LEAVE MARKER:", id);
          if (onHoverChange) onHoverChange(null);
        }, 80);
      };

      el.innerText = new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(price);

      // Removed manual transformOrigin/transform, handled by CSS and Marker offset
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "bottom",
        offset: [0, -10],
      })
        .setLngLat([lng, lat])
        .addTo(map);

      (marker as any).__listingId = id;
      (marker as any).__el = el;

      newMarkers.push(marker);
    });

    // Remove markers that are no longer in view
    existingMarkers.forEach((marker) => marker.remove());

    markersRef.current = newMarkers;

    console.log("Total listings:", safeListings.length);
    console.log("Total markers rendered:", markersRef.current.length);
  }, [listings, onBoundsChange]);

  useEffect(() => {
    markersRef.current.forEach((marker: any) => {
      const el = marker.__el;
      if (!el) return;

      if (marker.__listingId === hoveredId) {
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
    if ((map as any).__hoverPopup) {
      (map as any).__hoverPopup.remove();
      (map as any).__hoverPopup = null;
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

    (map as any).__hoverPopup = popup;

    return () => {
      if ((map as any).__hoverPopup) {
        (map as any).__hoverPopup.remove();
        (map as any).__hoverPopup = null;
      }
    };
  }, [hoveredListing]);

  // Inject Airbnb-style marker CSS once
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
