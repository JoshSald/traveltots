"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

type ListingCategoryOption = {
  _id: string;
  name: string;
  slug: string;
};

type ListingFormOptionsResponse = {
  categories: ListingCategoryOption[];
  brands: string[];
  models: string[];
};

type ListingDetailsResponse = {
  _id?: string;
  title?: string;
  description?: string;
  category?: string | { _id?: string };
  brand?: string;
  model?: string;
  pricePerDay?: number;
  pricePerHour?: number | null;
  locationName?: string;
  images?: string[];
  features?: string[];
};

type SessionResponse = {
  user?: {
    id?: string;
    _id?: string;
  };
  data?: {
    user?: {
      id?: string;
      _id?: string;
    };
  };
};

type ListingDraft = {
  title: string;
  category: string;
  description: string;
  brand: string;
  model: string;
  pricePerDay: string;
  pricePerHour: string;
  locationName: string;
  imageUrls: string;
  features: string;
};

const initialDraft: ListingDraft = {
  title: "",
  category: "",
  description: "",
  brand: "",
  model: "",
  pricePerDay: "",
  pricePerHour: "",
  locationName: "",
  imageUrls: "",
  features: "",
};

function createDraftListingId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

function buildClientApiPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

async function readApiResponse<T>(response: Response) {
  const raw = await response.text();

  if (!raw) {
    return { json: null as T | null, raw: "" };
  }

  try {
    return { json: JSON.parse(raw) as T, raw };
  } catch {
    return { json: null as T | null, raw };
  }
}

async function geocodeLocationName(locationName: string) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error("Missing NEXT_PUBLIC_MAPBOX_TOKEN for location geocoding.");
  }

  const query = locationName.trim();
  if (!query) {
    throw new Error("Please provide a valid location name.");
  }

  const encoded = encodeURIComponent(query);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?limit=1&access_token=${token}`;

  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Unable to geocode location (${response.status}).`);
  }

  const payload = (await response.json()) as {
    features?: Array<{ center?: [number, number] }>;
  };

  const center = payload.features?.[0]?.center;
  if (
    !Array.isArray(center) ||
    center.length !== 2 ||
    typeof center[0] !== "number" ||
    typeof center[1] !== "number"
  ) {
    throw new Error("We could not find that location on the map.");
  }

  return center as [number, number];
}

function NewListingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingListingId = searchParams.get("listingId");
  const isEditMode = Boolean(editingListingId);
  const [draftListingId, setDraftListingId] = useState<string>(() =>
    createDraftListingId(),
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ListingDraft>(initialDraft);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ListingCategoryOption[]>([]);
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [activeBrandIndex, setActiveBrandIndex] = useState(-1);
  const [activeModelIndex, setActiveModelIndex] = useState(-1);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSavingListing, setIsSavingListing] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);

  const updateDraft = (field: keyof ListingDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const loadListingFormOptions = async (categoryId?: string) => {
    const query = categoryId
      ? `?categoryId=${encodeURIComponent(categoryId)}`
      : "";

    const response = await fetch(
      buildClientApiPath(`/api/listings/form-options${query}`),
      {
        credentials: "include",
        cache: "no-store",
      },
    );

    const { json, raw } =
      await readApiResponse<ListingFormOptionsResponse>(response);

    if (!response.ok) {
      throw new Error(
        raw
          ? `Request failed (${response.status}): ${raw.slice(0, 140)}`
          : `Request failed (${response.status})`,
      );
    }

    if (!json) {
      throw new Error("Options API returned an invalid response format.");
    }

    return json;
  };

  const getSessionUserId = async (): Promise<string | null> => {
    const endpoints = ["/api/auth/session"];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(buildClientApiPath(endpoint), {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          continue;
        }

        const { json: payload } =
          await readApiResponse<SessionResponse>(response);
        if (!payload) {
          continue;
        }

        const user = payload.user ?? payload.data?.user;
        const id = user?.id ?? user?._id;

        if (typeof id === "string" && id) {
          setCurrentUserId(id);
          return id;
        }
      } catch {
        // Try next endpoint.
      }
    }

    setCurrentUserId(null);
    return null;
  };

  const getCategoryIdValue = (
    category: ListingDetailsResponse["category"],
  ): string => {
    if (typeof category === "string") {
      return category;
    }

    if (
      category &&
      typeof category === "object" &&
      typeof category._id === "string"
    ) {
      return category._id;
    }

    return "";
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsOptionsLoading(true);
      setOptionsError(null);

      try {
        const data = await loadListingFormOptions();

        if (!isMounted) return;

        setCategories(data.categories || []);
        setBrandSuggestions(data.brands || []);
        setModelSuggestions(data.models || []);
      } catch {
        if (!isMounted) return;
        setOptionsError(
          "Unable to load category, brand, and model suggestions from the database.",
        );
      } finally {
        if (isMounted) {
          setIsOptionsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadListingForEdit = async () => {
      if (!editingListingId) return;

      setIsEditLoading(true);
      try {
        const response = await fetch(
          buildClientApiPath(`/api/listings/${editingListingId}`),
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const { json, raw } =
          await readApiResponse<ListingDetailsResponse>(response);

        if (!response.ok || !json) {
          throw new Error(
            raw
              ? `Unable to load listing (${response.status}): ${raw.slice(0, 160)}`
              : `Unable to load listing (${response.status}).`,
          );
        }

        if (!isMounted) return;

        const images = Array.isArray(json.images) ? json.images : [];
        const features = Array.isArray(json.features) ? json.features : [];

        setDraft({
          title: json.title || "",
          category: getCategoryIdValue(json.category),
          description: json.description || "",
          brand: json.brand || "",
          model: json.model || "",
          pricePerDay:
            typeof json.pricePerDay === "number"
              ? String(json.pricePerDay)
              : "",
          pricePerHour:
            typeof json.pricePerHour === "number"
              ? String(json.pricePerHour)
              : "",
          locationName: json.locationName || "",
          imageUrls: images.join(", "),
          features: features.join(", "),
        });
        setUploadedImageUrls(images);
        setDraftListingId(editingListingId);
      } catch (error) {
        if (!isMounted) return;
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load listing for editing.",
        );
      } finally {
        if (isMounted) {
          setIsEditLoading(false);
        }
      }
    };

    loadListingForEdit();

    return () => {
      isMounted = false;
    };
  }, [editingListingId]);

  useEffect(() => {
    let isMounted = true;

    const refreshSuggestions = async () => {
      try {
        const data = await loadListingFormOptions(draft.category || undefined);
        if (!isMounted) return;

        setBrandSuggestions(data.brands || []);
        setModelSuggestions(data.models || []);
      } catch {
        if (!isMounted) return;
        setBrandSuggestions([]);
        setModelSuggestions([]);
      }
    };

    refreshSuggestions();

    return () => {
      isMounted = false;
    };
  }, [draft.category]);

  useEffect(() => {
    let isMounted = true;

    const loadSessionUser = async () => {
      const id = await getSessionUserId();
      if (!isMounted) return;
      setCurrentUserId(id);
    };

    loadSessionUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const categoryPlaceholder = useMemo(() => {
    if (isOptionsLoading) return "Loading categories...";
    if (categories.length === 0) return "No categories found";
    return "Select category";
  }, [categories.length, isOptionsLoading]);

  const filteredBrandSuggestions = useMemo(() => {
    const query = draft.brand.trim().toLowerCase();
    const rows = query
      ? brandSuggestions.filter((value) => value.toLowerCase().includes(query))
      : brandSuggestions;
    return rows.slice(0, 8);
  }, [brandSuggestions, draft.brand]);

  const filteredModelSuggestions = useMemo(() => {
    const query = draft.model.trim().toLowerCase();
    const rows = query
      ? modelSuggestions.filter((value) => value.toLowerCase().includes(query))
      : modelSuggestions;
    return rows.slice(0, 8);
  }, [modelSuggestions, draft.model]);

  useEffect(() => {
    if (activeBrandIndex >= filteredBrandSuggestions.length) {
      setActiveBrandIndex(filteredBrandSuggestions.length - 1);
    }
  }, [activeBrandIndex, filteredBrandSuggestions.length]);

  useEffect(() => {
    if (activeModelIndex >= filteredModelSuggestions.length) {
      setActiveModelIndex(filteredModelSuggestions.length - 1);
    }
  }, [activeModelIndex, filteredModelSuggestions.length]);

  const pickBrandSuggestion = (value: string) => {
    updateDraft("brand", value);
    setIsBrandMenuOpen(false);
    setActiveBrandIndex(-1);
  };

  const pickModelSuggestion = (value: string) => {
    updateDraft("model", value);
    setIsModelMenuOpen(false);
    setActiveModelIndex(-1);
  };

  const handleBrandKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsBrandMenuOpen(true);
      setActiveBrandIndex((prev) =>
        Math.min(prev + 1, filteredBrandSuggestions.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsBrandMenuOpen(true);
      setActiveBrandIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === "Enter" && isBrandMenuOpen && activeBrandIndex >= 0) {
      event.preventDefault();
      const next = filteredBrandSuggestions[activeBrandIndex];
      if (next) pickBrandSuggestion(next);
      return;
    }

    if (event.key === "Escape") {
      setIsBrandMenuOpen(false);
      setActiveBrandIndex(-1);
    }
  };

  const handleModelKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsModelMenuOpen(true);
      setActiveModelIndex((prev) =>
        Math.min(prev + 1, filteredModelSuggestions.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsModelMenuOpen(true);
      setActiveModelIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === "Enter" && isModelMenuOpen && activeModelIndex >= 0) {
      event.preventDefault();
      const next = filteredModelSuggestions[activeModelIndex];
      if (next) pickModelSuggestion(next);
      return;
    }

    if (event.key === "Escape") {
      setIsModelMenuOpen(false);
      setActiveModelIndex(-1);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const userId = currentUserId ?? (await getSessionUserId());

    setIsSavingListing(true);

    try {
      const features = draft.features
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      const locationCoordinates = await geocodeLocationName(draft.locationName);

      const requestBody = {
        ...(isEditMode ? {} : { listingId: draftListingId }),
        ownerId: userId,
        title: draft.title,
        description: draft.description,
        category: draft.category,
        brand: draft.brand,
        model: draft.model,
        pricePerDay: draft.pricePerDay,
        pricePerHour: draft.pricePerHour || null,
        locationName: draft.locationName,
        imageUrls: uploadedImageUrls,
        features,
        coordinates: locationCoordinates,
      };

      const endpoint = isEditMode
        ? buildClientApiPath(`/api/listings/${editingListingId}`)
        : buildClientApiPath("/api/listings");

      const method = isEditMode ? "PATCH" : "POST";

      const submitResponse = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const { json: payload, raw } = await readApiResponse<{
        _id?: string;
        error?: string;
        message?: string;
      }>(submitResponse);

      if (!submitResponse.ok) {
        throw new Error(
          (submitResponse.status === 401 &&
            `Please sign in before ${isEditMode ? "editing" : "creating"} a listing.`) ||
            payload?.error ||
            payload?.message ||
            (raw
              ? `Unable to ${isEditMode ? "update" : "create"} listing (${submitResponse.status}): ${raw.slice(0, 180)}`
              : `Unable to ${isEditMode ? "update" : "create"} listing (${submitResponse.status}).`),
        );
      }

      if (payload?._id) {
        toast.success(
          isEditMode
            ? "Listing updated successfully."
            : "Listing created successfully.",
        );
        router.push(`/listings/${payload._id}`);
        return;
      }

      toast.success(
        isEditMode
          ? "Listing updated successfully."
          : "Listing created successfully.",
      );

      setDraft(initialDraft);
      setUploadedImageUrls([]);
      setDraftListingId(createDraftListingId());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create listing right now.",
      );
    } finally {
      setIsSavingListing(false);
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      const missingVars = [
        !cloudName ? "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" : null,
        !uploadPreset ? "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET" : null,
      ]
        .filter(Boolean)
        .join(", ");

      throw new Error(`Cloudinary is not configured. Missing ${missingVars}.`);
    }

    const userId = currentUserId ?? (await getSessionUserId());
    if (!userId) {
      throw new Error("Please sign in before uploading listing images.");
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const formData = new FormData();
    const folderPath = `TinyTribe/UserUploaded/${userId}/${draftListingId}`;

    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", folderPath);

    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed (${response.status}).`);
    }

    const payload = (await response.json()) as {
      secure_url?: string;
      url?: string;
    };

    const url = payload.secure_url || payload.url;
    if (!url) {
      throw new Error("Cloudinary response did not include an image URL.");
    }

    return url;
  };

  const handleFilesSelected = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);

    try {
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length === 0) {
        throw new Error("Please select at least one image file.");
      }

      const uploaded = await Promise.all(
        imageFiles.map((file) => uploadImageToCloudinary(file)),
      );

      const nextUrls = Array.from(new Set([...uploadedImageUrls, ...uploaded]));
      setUploadedImageUrls(nextUrls);
      updateDraft("imageUrls", nextUrls.join(", "));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Image upload failed.";
      toast.error(errorMessage);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const removeUploadedImage = (urlToRemove: string) => {
    const nextUrls = uploadedImageUrls.filter((url) => url !== urlToRemove);
    setUploadedImageUrls(nextUrls);
    updateDraft("imageUrls", nextUrls.join(", "));
  };

  return (
    <main className="min-h-screen bg-(--color-background) text-(--color-text-primary)">
      <div className="mx-auto max-w-4xl px-6 pb-16 pt-24 md:px-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[42px] font-semibold leading-none tracking-[-0.04em] text-(--color-text-primary)">
              {isEditMode ? "Edit Listing" : "Add A Listing"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-(--color-text-secondary)">
              {isEditMode
                ? "Update your listing details, pricing, photos, and location."
                : "Start your hosting draft now. We will connect this form to the listings API in the next step."}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="btn-secondary inline-flex items-center justify-center px-4 py-2 text-xs uppercase tracking-wide"
          >
            Back To Dashboard
          </Link>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-lg border border-(--color-border) bg-(--color-surface) p-6 shadow-[0_8px_28px_rgba(45,52,53,0.08)] md:p-8"
        >
          {isEditLoading ? (
            <p className="text-sm text-(--color-text-muted)">
              Loading listing details...
            </p>
          ) : null}

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-(--color-text-primary)">
              Basics
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={draft.title}
                  onChange={(event) => updateDraft("title", event.target.value)}
                  placeholder="UPPAbaby Vista V2"
                  className="h-10 rounded-sm border-(--color-border) bg-(--color-surface-lowest) px-3 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={draft.category || "none"}
                  onValueChange={(value: string) =>
                    updateDraft("category", value === "none" ? "" : value)
                  }
                  disabled={isOptionsLoading}
                >
                  <SelectTrigger className="h-10 w-full rounded-sm border border-(--color-border) bg-(--color-surface-lowest) px-3 text-sm text-(--color-text-primary) shadow-none hover:bg-(--color-surface-low) focus-visible:ring-0 disabled:cursor-wait disabled:opacity-70">
                    <SelectValue placeholder={categoryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{categoryPlaceholder}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {optionsError ? (
                  <p className="text-xs text-(--color-text-muted)">
                    {optionsError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  rows={5}
                  value={draft.description}
                  onChange={(event) =>
                    updateDraft("description", event.target.value)
                  }
                  placeholder="Tell renters what makes this item useful for travel."
                  className="w-full rounded-sm border border-(--color-border) bg-(--color-surface-lowest) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus-visible:ring-1 focus-visible:ring-(--color-border)"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-(--color-text-primary)">
              Product Details
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <div className="relative">
                  <Input
                    id="brand"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={isBrandMenuOpen}
                    aria-controls="brand-suggestions-listbox"
                    aria-activedescendant={
                      activeBrandIndex >= 0
                        ? `brand-option-${activeBrandIndex}`
                        : undefined
                    }
                    value={draft.brand}
                    onFocus={() => {
                      setIsBrandMenuOpen(true);
                      setActiveBrandIndex(-1);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setIsBrandMenuOpen(false);
                        setActiveBrandIndex(-1);
                      }, 120);
                    }}
                    onKeyDown={handleBrandKeyDown}
                    onChange={(event) => {
                      updateDraft("brand", event.target.value);
                      setIsBrandMenuOpen(true);
                      setActiveBrandIndex(-1);
                    }}
                    placeholder="UPPAbaby"
                    className="h-10 rounded-sm border-(--color-border) bg-(--color-surface-lowest) px-3 text-sm"
                  />

                  {isBrandMenuOpen ? (
                    <ul
                      id="brand-suggestions-listbox"
                      role="listbox"
                      aria-label="Brand suggestions"
                      className="absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-sm border border-(--color-border) bg-(--color-surface) py-1 text-sm text-(--color-text-primary) shadow-md ring-1 ring-(--color-border)/40"
                    >
                      {filteredBrandSuggestions.length > 0 ? (
                        filteredBrandSuggestions.map((brand, index) => (
                          <li key={brand} role="presentation">
                            <button
                              id={`brand-option-${index}`}
                              role="option"
                              aria-selected={activeBrandIndex === index}
                              type="button"
                              className={`w-full px-3 py-2 text-left text-sm text-(--color-text-primary) ${
                                activeBrandIndex === index
                                  ? "bg-(--color-accent-light) font-medium"
                                  : "hover:bg-(--color-accent-light) hover:font-medium"
                              }`}
                              onMouseEnter={() => setActiveBrandIndex(index)}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => pickBrandSuggestion(brand)}
                            >
                              {brand}
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-2 text-sm text-(--color-text-muted)">
                          {isOptionsLoading
                            ? "Loading brand suggestions..."
                            : "No matching brands"}
                        </li>
                      )}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <div className="relative">
                  <Input
                    id="model"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={isModelMenuOpen}
                    aria-controls="model-suggestions-listbox"
                    aria-activedescendant={
                      activeModelIndex >= 0
                        ? `model-option-${activeModelIndex}`
                        : undefined
                    }
                    value={draft.model}
                    onFocus={() => {
                      setIsModelMenuOpen(true);
                      setActiveModelIndex(-1);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setIsModelMenuOpen(false);
                        setActiveModelIndex(-1);
                      }, 120);
                    }}
                    onKeyDown={handleModelKeyDown}
                    onChange={(event) => {
                      updateDraft("model", event.target.value);
                      setIsModelMenuOpen(true);
                      setActiveModelIndex(-1);
                    }}
                    placeholder="Vista V2"
                    className="h-10 rounded-sm border-(--color-border) bg-(--color-surface-lowest) px-3 text-sm"
                  />

                  {isModelMenuOpen ? (
                    <ul
                      id="model-suggestions-listbox"
                      role="listbox"
                      aria-label="Model suggestions"
                      className="absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-sm border border-(--color-border) bg-(--color-surface) py-1 text-sm text-(--color-text-primary) shadow-md ring-1 ring-(--color-border)/40"
                    >
                      {filteredModelSuggestions.length > 0 ? (
                        filteredModelSuggestions.map((model, index) => (
                          <li key={model} role="presentation">
                            <button
                              id={`model-option-${index}`}
                              role="option"
                              aria-selected={activeModelIndex === index}
                              type="button"
                              className={`w-full px-3 py-2 text-left text-sm text-(--color-text-primary) ${
                                activeModelIndex === index
                                  ? "bg-(--color-accent-light) font-medium"
                                  : "hover:bg-(--color-accent-light) hover:font-medium"
                              }`}
                              onMouseEnter={() => setActiveModelIndex(index)}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => pickModelSuggestion(model)}
                            >
                              {model}
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-2 text-sm text-(--color-text-muted)">
                          {isOptionsLoading
                            ? "Loading model suggestions..."
                            : "No matching models"}
                        </li>
                      )}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-(--color-text-primary)">
              Pricing And Location
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="pricePerDay">Price Per Day (EUR)</Label>
                <Input
                  id="pricePerDay"
                  type="number"
                  min="0"
                  value={draft.pricePerDay}
                  onChange={(event) =>
                    updateDraft("pricePerDay", event.target.value)
                  }
                  placeholder="25"
                  className="h-10 rounded-sm border-(--color-border) bg-(--color-surface-lowest) px-3 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerHour">Price Per Hour (optional)</Label>
                <Input
                  id="pricePerHour"
                  type="number"
                  min="0"
                  value={draft.pricePerHour}
                  onChange={(event) =>
                    updateDraft("pricePerHour", event.target.value)
                  }
                  placeholder="5"
                  className="h-10 rounded-sm border-(--color-border) bg-(--color-surface-lowest) px-3 text-sm"
                />
              </div>

              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="locationName">Location Name</Label>
                <Input
                  id="locationName"
                  value={draft.locationName}
                  onChange={(event) =>
                    updateDraft("locationName", event.target.value)
                  }
                  placeholder="Upper East Side, NYC"
                  className="h-10 rounded-sm border-(--color-border) bg-(--color-surface-lowest) px-3 text-sm"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-(--color-text-primary)">
              Media And Features
            </h2>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="imageUpload">Listing Images</Label>

                <div className="rounded-sm border border-(--color-border) bg-(--color-surface-lowest) p-3">
                  <FileUpload
                    onChange={handleFilesSelected}
                    disabled={isUploadingImages}
                    accept="image/*"
                    title={
                      isUploadingImages ? "Uploading images..." : "Upload file"
                    }
                    subtitle="Drag or drop your files here or click to upload"
                  />

                  <p className="mt-3 text-xs text-(--color-text-muted)">
                    JPG, PNG, and WebP supported.
                  </p>

                  {isUploadingImages ? (
                    <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-(--color-text-secondary)">
                      <Loader2 className="size-4 animate-spin" />
                      Uploading to Cloudinary...
                    </div>
                  ) : null}

                  {uploadedImageUrls.length > 0 ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {uploadedImageUrls.map((url, index) => (
                        <div
                          key={url}
                          className="relative overflow-hidden rounded-sm border border-(--color-border) bg-(--color-surface)"
                        >
                          <Image
                            src={url}
                            alt={`Uploaded listing image ${index + 1}`}
                            className="h-28 w-full object-cover"
                            width={320}
                            height={112}
                            loading="lazy"
                          />
                          <button
                            type="button"
                            onClick={() => removeUploadedImage(url)}
                            className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-sm border border-(--color-border) bg-(--color-surface-lowest) text-(--color-text-primary) hover:bg-(--color-surface-muted)"
                            aria-label="Remove uploaded image"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (comma separated)</Label>
                <textarea
                  id="features"
                  rows={3}
                  value={draft.features}
                  onChange={(event) =>
                    updateDraft("features", event.target.value)
                  }
                  placeholder="Large basket, rain cover included, travel bag"
                  className="w-full rounded-sm border border-(--color-border) bg-(--color-surface-lowest) px-3 py-2 text-sm text-(--color-text-primary) outline-none focus-visible:ring-1 focus-visible:ring-(--color-border)"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-(--color-border) pt-6">
            <button
              type="button"
              onClick={() => {
                setDraft(initialDraft);
                setUploadedImageUrls([]);
                setDraftListingId(createDraftListingId());
                toast.success("Draft reset.");
              }}
              className="btn-secondary"
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2"
              disabled={isSavingListing || isUploadingImages || isEditLoading}
            >
              {isSavingListing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {isSavingListing
                ? "Saving..."
                : isEditMode
                  ? "Update Listing"
                  : "Create Listing"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function NewListingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-(--color-background) text-(--color-text-primary)">
          <div className="mx-auto max-w-4xl px-6 pb-16 pt-24 md:px-8">
            <p className="text-sm text-(--color-text-muted)">
              Loading listing form...
            </p>
          </div>
        </main>
      }
    >
      <NewListingPageContent />
    </Suspense>
  );
}
