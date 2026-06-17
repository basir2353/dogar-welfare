import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, resolveMediaUrl } from "@/utils/api";
import { useAuthStore, type UserProfile } from "@/store/auth-store";
import type { AxiosError } from "axios";

const MAX_RISHTA_PHOTOS = 5;

type MImg = { id: string; url: string; isBanner: boolean };
type InterestUser = {
  userId: string;
  fullName: string;
  city?: string;
};

const defaultEditableProfile: UserProfile = {
  fullName: "",
  city: "",
  phone: "",
  whatsapp: "",
  address: "",
  education: "",
  profession: "",
  hobbies: "",
  profilePhotoUrl: "",
  preferredCity: "",
  preferredAgeRange: "",
  preferredProfession: "",
  bio: ""
};

export function MyProfilePage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [interestLoading, setInterestLoading] = useState(false);
  const [interestedUsers, setInterestedUsers] = useState<InterestUser[]>([]);
  const [rishtaPhotos, setRishtaPhotos] = useState<MImg[]>([]);
  const [galleryMessage, setGalleryMessage] = useState("");
  const [form, setForm] = useState<UserProfile>(profile ?? defaultEditableProfile);

  const hasProfile = Boolean(profile?.fullName?.trim() && profile?.city?.trim());

  const displayName = useMemo(() => profile?.fullName || "Profile", [profile?.fullName]);

  const updateField = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleProfilePhotoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      if (value) {
        updateField("profilePhotoUrl", value);
      }
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.fullName?.trim() || !form.city?.trim()) {
      setMessage("Full name and city are required.");
      return;
    }
    try {
      const payload = {
        fullName: form.fullName.trim(),
        city: form.city.trim(),
        bio: form.bio?.trim() || undefined,
        profilePhotoUrl: form.profilePhotoUrl,
        age: form.age,
        sect: form.sect,
        profession: form.profession,
        education: form.education,
        maritalStatus: form.maritalStatus,
        monthlyIncome: form.monthlyIncome,
        fatherName: form.fatherName
      };
      const { data } = await api.put("/users/profile", payload);
      const persisted = data.success ? (data.data as Partial<UserProfile>) : {};
      setProfile({
        ...profile,
        ...form,
        ...persisted,
        fullName: payload.fullName,
        city: payload.city
      });
      setEditing(false);
      setMessage("Profile updated successfully.");
      setTimeout(() => setMessage(""), 1600);
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setMessage(backendMessage ?? "Unable to save profile right now.");
    }
  };

  const loadRishtaPhotos = async () => {
    try {
      const { data } = await api.get("/users/me");
      if (data.success && data.data?.matrimonial?.images) {
        setRishtaPhotos(
          (data.data.matrimonial.images as MImg[]).map((i) => ({
            id: i.id,
            url: i.url,
            isBanner: i.isBanner
          }))
        );
      } else {
        setRishtaPhotos([]);
      }
    } catch {
      setRishtaPhotos([]);
    }
  };

  const uploadRishtaPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (rishtaPhotos.length >= MAX_RISHTA_PHOTOS) {
      setGalleryMessage(`You can add at most ${MAX_RISHTA_PHOTOS} photos.`);
      return;
    }
    const body = new FormData();
    body.append("file", file);
    setGalleryMessage("");
    try {
      const { data } = await api.post("/matrimonial/photos", body, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (data.success) {
        setGalleryMessage("Photo added.");
        setTimeout(() => setGalleryMessage(""), 2000);
        await loadRishtaPhotos();
      }
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setGalleryMessage(backendMessage ?? "Could not upload photo.");
    }
  };

  const setRishtaBanner = async (imageId: string) => {
    try {
      await api.patch("/matrimonial/photos/banner", { imageId });
      setGalleryMessage("Banner updated.");
      setTimeout(() => setGalleryMessage(""), 2000);
      await loadRishtaPhotos();
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setGalleryMessage(backendMessage ?? "Could not set banner.");
    }
  };

  const deleteRishtaPhoto = async (id: string) => {
    try {
      await api.delete(`/matrimonial/photos/${id}`);
      setGalleryMessage("Photo removed.");
      setTimeout(() => setGalleryMessage(""), 2000);
      await loadRishtaPhotos();
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      setGalleryMessage(backendMessage ?? "Could not remove photo.");
    }
  };

  const loadInterestedUsers = async () => {
    setInterestLoading(true);
    try {
      const endpointCandidates = [
        "/matrimonial/interests/received",
        "/matrimonial/interests/incoming",
        "/matrimonial/interests"
      ];
      let loaded = false;
      for (const endpoint of endpointCandidates) {
        try {
          const { data } = await api.get(endpoint);
          if (data.success && Array.isArray(data.data)) {
            const mapped = data.data.map((item: { senderId?: string; sender?: { profile?: { fullName?: string; city?: string } } }) => ({
              userId: item.senderId ?? "",
              fullName: item.sender?.profile?.fullName ?? "Member",
              city: item.sender?.profile?.city ?? "Unknown"
            })).filter((item: InterestUser) => item.userId);
            setInterestedUsers(mapped);
            loaded = true;
            break;
          }
        } catch {
          // Try next endpoint candidate.
        }
      }
      if (!loaded) {
        setInterestedUsers([]);
      }
    } finally {
      setInterestLoading(false);
    }
  };

  useEffect(() => {
    if (!hasProfile) return;
    void loadInterestedUsers();
    void loadRishtaPhotos();
  }, [hasProfile]);

  if (!hasProfile) {
    return (
      <Card className="glass mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-semibold">Profile not completed yet</h1>
        <p className="mt-2 text-subtle">Complete your profile once to unlock the profile section and interest inbox.</p>
        <div className="mt-5">
          <Button onClick={() => navigate("/profile/setup")}>Complete Profile</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">My Profile</p>
            <h1 className="mt-2 text-2xl font-semibold">{displayName}</h1>
            <p className="text-subtle">{profile?.city}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/profile/setup")}>Full Profile Setup</Button>
            <Button onClick={() => setEditing((prev) => !prev)}>{editing ? "Cancel" : "Edit Details"}</Button>
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}
      </Card>

      <Card className="glass">
        <h2 className="text-lg font-semibold">Profile Details</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {editing ? (
            <>
              <Input value={form.fullName ?? ""} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Full name" />
              <Input value={form.city ?? ""} onChange={(e) => updateField("city", e.target.value)} placeholder="City" />
              <Input type="tel" value={form.phone ?? ""} onChange={(e) => updateField("phone", e.target.value)} placeholder="Phone number" />
              <Input type="tel" value={form.whatsapp ?? ""} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="WhatsApp number" />
              <Input value={form.address ?? ""} onChange={(e) => updateField("address", e.target.value)} placeholder="Address" />
              <Input value={form.education ?? ""} onChange={(e) => updateField("education", e.target.value)} placeholder="Education" />
              <Input value={form.profession ?? ""} onChange={(e) => updateField("profession", e.target.value)} placeholder="Profession" />
              <Input value={form.hobbies ?? ""} onChange={(e) => updateField("hobbies", e.target.value)} placeholder="Hobbies / interests" />
              <Input value={form.preferredCity ?? ""} onChange={(e) => updateField("preferredCity", e.target.value)} placeholder="Preferred city" />
              <Input value={form.preferredAgeRange ?? ""} onChange={(e) => updateField("preferredAgeRange", e.target.value)} placeholder="Preferred age range" />
              <Input value={form.preferredProfession ?? ""} onChange={(e) => updateField("preferredProfession", e.target.value)} placeholder="Preferred profession" />
              <div className="md:col-span-2">
                <Input type="file" accept="image/*" onChange={handleProfilePhotoUpload} />
              </div>
              <textarea
                value={form.bio ?? ""}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Short bio"
                className="min-h-28 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary md:col-span-2"
              />
              <div className="md:col-span-2">
                <Button onClick={() => void save()}>Save Changes</Button>
              </div>
            </>
          ) : (
            <>
              {profile?.profilePhotoUrl ? (
                <img src={profile.profilePhotoUrl} alt={profile.fullName} className="h-24 w-24 rounded-full object-cover ring-2 ring-primary/40" />
              ) : null}
              <p><span className="text-subtle">Phone:</span> {profile?.phone || "Not set"}</p>
              <p><span className="text-subtle">WhatsApp:</span> {profile?.whatsapp || "Not set"}</p>
              <p><span className="text-subtle">Address:</span> {profile?.address || "Not set"}</p>
              <p><span className="text-subtle">Education:</span> {profile?.education || "Not set"}</p>
              <p><span className="text-subtle">Profession:</span> {profile?.profession || "Not set"}</p>
              <p><span className="text-subtle">Hobbies:</span> {profile?.hobbies || "Not set"}</p>
              <p><span className="text-subtle">Preferred city:</span> {profile?.preferredCity || "Not set"}</p>
              <p><span className="text-subtle">Preferred age range:</span> {profile?.preferredAgeRange || "Not set"}</p>
              <p><span className="text-subtle">Preferred profession:</span> {profile?.preferredProfession || "Not set"}</p>
              <p className="md:col-span-2"><span className="text-subtle">Bio:</span> {profile?.bio || "Not set"}</p>
            </>
          )}
        </div>
      </Card>

      <Card className="glass">
        <h2 className="text-lg font-semibold">Rishta photos</h2>
        <p className="mt-1 text-sm text-subtle">
          Add up to {MAX_RISHTA_PHOTOS} photos. Choose one as your banner; it is used on your card and in discovery.
        </p>
        {galleryMessage ? <p className="mt-2 text-sm text-accent">{galleryMessage}</p> : null}
        <div className="mt-3">
          <Input
            type="file"
            accept="image/*"
            disabled={rishtaPhotos.length >= MAX_RISHTA_PHOTOS}
            onChange={(e) => void uploadRishtaPhoto(e)}
          />
        </div>
        {rishtaPhotos.length > 0 ? (
          <ul className="mt-4 grid list-none gap-3 sm:grid-cols-2 md:grid-cols-3">
            {rishtaPhotos.map((img) => (
              <li
                key={img.id}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-2"
              >
                <img
                  src={resolveMediaUrl(img.url)}
                  alt=""
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {img.isBanner ? (
                    <span className="rounded-lg bg-primary/20 px-2 py-0.5 text-xs text-primary">Banner</span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs"
                      onClick={() => void setRishtaBanner(img.id)}
                    >
                      Set as banner
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs text-rose-300"
                    onClick={() => void deleteRishtaPhoto(img.id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-faint">No photos yet.</p>
        )}
      </Card>

      <Card className="glass">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">People Interested In You</h2>
          <Button variant="outline" onClick={() => void loadInterestedUsers()} disabled={interestLoading}>
            {interestLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {interestedUsers.length === 0 ? (
            <p className="text-sm text-subtle">No incoming interests yet.</p>
          ) : (
            interestedUsers.map((item) => (
              <div key={item.userId} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
                <div>
                  <p className="font-medium">{item.fullName}</p>
                  <p className="text-sm text-subtle">{item.city || "Unknown city"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => navigate(`/matrimonial/${item.userId}`)}>
                    View profile
                  </Button>
                  <Button onClick={() => navigate("/chat")}>Chat</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
