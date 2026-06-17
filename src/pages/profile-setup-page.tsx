import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore, type UserProfile } from "@/store/auth-store";
import { api } from "@/utils/api";
import type { AxiosError } from "axios";

const defaultProfile: UserProfile = {
  fullName: "",
  city: "",
  bio: "",
  gender: "",
  dateOfBirth: "",
  age: "",
  maritalStatus: "",
  childrenCount: "",
  childrenDetails: "",
  religion: "",
  sect: "",
  caste: "",
  nationality: "",
  motherTongue: "",
  phone: "",
  whatsapp: "",
  emailContact: "",
  address: "",
  education: "",
  profession: "",
  monthlyIncome: "",
  companyName: "",
  height: "",
  weight: "",
  bloodGroup: "",
  disability: "",
  fatherName: "",
  motherName: "",
  familyType: "",
  siblings: "",
  preferredCity: "",
  preferredAgeRange: "",
  preferredProfession: "",
  profilePhotoUrl: "",
  hobbies: "",
  languagesKnown: "",
  smoking: "",
  relocateWillingness: ""
};
const FALLBACK_PAKISTAN_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala"
];
const NATIONALITY_OPTIONS = ["Pakistani", "Other"];
const MOTHER_TONGUE_OPTIONS = ["Urdu", "Punjabi", "Saraiki", "Pashto", "Sindhi", "Balochi", "Hindko", "Kashmiri", "Other"];
const RELIGION_OPTIONS = ["Islam", "Christianity", "Hinduism", "Sikhism", "Other"];
const SECT_OPTIONS = ["Sunni", "Shia", "Ahl-e-Hadith", "Barelvi", "Deobandi", "Other"];
const DEFAULT_CASTE_OPTIONS = ["Dogar", "Jutt", "Rajput", "Sheikh", "Arain"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const DISABILITY_OPTIONS = ["No", "Yes", "Prefer not to say"];
const FAMILY_TYPE_OPTIONS = ["Joint", "Nuclear", "Extended", "Other"];
const EDUCATION_OPTIONS = ["Matric", "Intermediate", "Bachelors", "Masters", "MPhil", "PhD", "Other"];
const PROFESSION_OPTIONS = ["Business", "Private Job", "Government Job", "Freelancer", "Student", "Other"];
const PREFERRED_AGE_RANGE_OPTIONS = ["18-22", "23-27", "28-32", "33-37", "38+"];

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const setProfile = useAuthStore((s) => s.setProfile);
  const existing = useAuthStore((s) => s.profile);

  const [form, setForm] = useState<UserProfile>(existing ?? defaultProfile);
  const [step, setStep] = useState(1);
  const [cities, setCities] = useState<string[]>(FALLBACK_PAKISTAN_CITIES);
  const [maritalStatuses, setMaritalStatuses] = useState<string[]>(["Single", "Married", "Divorced", "Widowed", "Separated"]);
  const [religions, setReligions] = useState<string[]>(RELIGION_OPTIONS);
  const [sects, setSects] = useState<string[]>(SECT_OPTIONS);
  const [castes, setCastes] = useState<string[]>(DEFAULT_CASTE_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const totalSteps = 4;
  const showChildrenFields = ["Divorced", "Widowed", "Separated"].includes(form.maritalStatus ?? "");
  const stepMeta = [
    { title: "Personal & Religious", subtitle: "Identity, background and faith details" },
    { title: "Health & Contact", subtitle: "Physical profile and reachability" },
    { title: "Career & Family", subtitle: "Education, work and household details" },
    { title: "Preferences & Bio", subtitle: "Lifestyle, partner preferences and short intro" }
  ];

  const updateField = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const loadProfileOptions = async () => {
      setOptionsLoading(true);
      try {
        const { data } = await api.get("/users/profile/options");
        if (data.success && data.data?.cities?.length) {
          setCities(data.data.cities as string[]);
        }
        if (data.success && data.data?.maritalStatuses?.length) {
          setMaritalStatuses(data.data.maritalStatuses as string[]);
        }
        if (data.success && data.data?.religions?.length) {
          setReligions(data.data.religions as string[]);
        }
        if (data.success && data.data?.sects?.length) {
          setSects(data.data.sects as string[]);
        }
        if (data.success && data.data?.castes?.length) {
          setCastes(data.data.castes as string[]);
        }
      } catch {
        // Keep built-in defaults when API is unavailable.
      } finally {
        setOptionsLoading(false);
      }
    };
    void loadProfileOptions();
  }, []);

  const handleDobChange = (value: string) => {
    const birthDate = new Date(value);
    if (Number.isNaN(birthDate.getTime())) {
      setForm((prev) => ({ ...prev, dateOfBirth: value }));
      return;
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    setForm((prev) => ({
      ...prev,
      dateOfBirth: value,
      age: age > 0 ? String(age) : prev.age
    }));
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

  const filteredCities = useMemo(() => {
    const search = form.city.trim().toLowerCase();
    if (!search) {
      return cities.slice(0, 8);
    }
    return cities.filter((city) => city.toLowerCase().includes(search)).slice(0, 8);
  }, [cities, form.city]);

  const nextStep = () => {
    if (step === 1) {
      if (!form.fullName?.trim()) {
        window.alert("Please fill full name.");
        return;
      }
      if (!form.city?.trim()) {
        window.alert("Please select or enter city.");
        return;
      }
      if (!form.maritalStatus?.trim()) {
        window.alert("Please select marital status.");
        return;
      }
      if (!form.nationality?.trim()) {
        window.alert("Please select nationality.");
        return;
      }
      if (!form.motherTongue?.trim()) {
        window.alert("Please select mother tongue.");
        return;
      }
    }
    if (step === 2 && (!form.phone?.trim() || !form.address?.trim())) {
      window.alert("Please fill phone and address before moving next.");
      return;
    }
    setStep((s) => Math.min(totalSteps, s + 1));
  };

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const submitProfile = async () => {
    if (!form.fullName.trim() || !form.city.trim()) return;
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

    try {
      const { data } = await api.put("/users/profile", payload);
      const persisted = data.success ? (data.data as Partial<UserProfile>) : {};
      setProfile({
        ...form,
        ...persisted,
        fullName: payload.fullName,
        city: payload.city
      });
      navigate("/", { replace: true });
    } catch (error) {
      const backendMessage = (error as AxiosError<{ error?: { message?: string } }>)?.response?.data?.error?.message;
      window.alert(backendMessage ?? "Unable to save profile right now. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl py-16">
      <Card className="glass">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Profile Creation</p>
        <h1 className="mt-3 text-3xl font-bold">Complete Your Profile</h1>
        <p className="mt-2 text-sm text-subtle">Step {step} of {totalSteps} - {stepMeta[step - 1].subtitle}</p>
        <p className="mt-1 text-base font-medium text-foreground">{stepMeta[step - 1].title}</p>
        <div className="mt-4 h-2 w-full rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {step === 1 ? (
            <>
              <Input value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Full name *" />
              <div className="space-y-2">
                <Input
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City in Pakistan *"
                  list="pakistan-cities"
                />
                <datalist id="pakistan-cities">
                  {cities.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
                <div className="flex flex-wrap gap-2">
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => updateField("city", city)}
                      className="rounded-full border border-border bg-card px-3 py-1 text-xs text-subtle hover:border-primary/50 hover:text-primary/90"
                    >
                      {city}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-subtle">
                  {optionsLoading ? "Loading Pakistan cities from live API..." : "City options use a free real-time public API."}
                </p>
              </div>
              <select
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => handleDobChange(e.target.value)} placeholder="Date of birth" />
              <Input value={form.age} onChange={(e) => updateField("age", e.target.value)} placeholder="Age (auto-filled from DOB)" />
              <select
                value={form.maritalStatus}
                onChange={(e) => updateField("maritalStatus", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Marital status</option>
                {maritalStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {showChildrenFields ? (
                <>
                  <Input
                    value={form.childrenCount}
                    onChange={(e) => updateField("childrenCount", e.target.value)}
                    placeholder="Number of children"
                  />
                  <Input
                    value={form.childrenDetails}
                    onChange={(e) => updateField("childrenDetails", e.target.value)}
                    placeholder="Children details (ages / living arrangement)"
                  />
                </>
              ) : null}
              <select
                value={form.nationality}
                onChange={(e) => updateField("nationality", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Select nationality</option>
                {NATIONALITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={form.motherTongue}
                onChange={(e) => updateField("motherTongue", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Select mother tongue</option>
                {MOTHER_TONGUE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={form.religion}
                onChange={(e) => updateField("religion", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Select religion</option>
                {religions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={form.sect}
                onChange={(e) => updateField("sect", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Select sect</option>
                {sects.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={form.caste}
                onChange={(e) => updateField("caste", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Select caste / biradari</option>
                {castes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Input value={form.languagesKnown} onChange={(e) => updateField("languagesKnown", e.target.value)} placeholder="Languages known" />
              <Input value={form.height} onChange={(e) => updateField("height", e.target.value)} placeholder="Height" />
              <Input value={form.weight} onChange={(e) => updateField("weight", e.target.value)} placeholder="Weight" />
              <select
                value={form.bloodGroup}
                onChange={(e) => updateField("bloodGroup", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={form.disability}
                onChange={(e) => updateField("disability", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Disability status</option>
                {DISABILITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="Phone number" />
              <Input type="tel" value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} placeholder="WhatsApp number" />
              <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Address" />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <select
                value={form.education}
                onChange={(e) => updateField("education", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Select education</option>
                {EDUCATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={form.profession}
                onChange={(e) => updateField("profession", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Select profession</option>
                {PROFESSION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Input type="number" min="0" value={form.monthlyIncome} onChange={(e) => updateField("monthlyIncome", e.target.value)} placeholder="Monthly income" />
              <Input value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} placeholder="Company / workplace" />
              <Input value={form.fatherName} onChange={(e) => updateField("fatherName", e.target.value)} placeholder="Father name" />
              <Input value={form.motherName} onChange={(e) => updateField("motherName", e.target.value)} placeholder="Mother name" />
              <select
                value={form.familyType}
                onChange={(e) => updateField("familyType", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Select family type</option>
                {FAMILY_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Input type="number" min="0" value={form.siblings} onChange={(e) => updateField("siblings", e.target.value)} placeholder="Number of siblings" />
            </>
          ) : null}

          {step === 4 ? (
            <>
              <Input value={form.hobbies} onChange={(e) => updateField("hobbies", e.target.value)} placeholder="Hobbies / interests" />
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm text-subtle">Profile photo</label>
                <Input type="file" accept="image/*" onChange={handleProfilePhotoUpload} />
                {form.profilePhotoUrl ? (
                  <img
                    src={form.profilePhotoUrl}
                    alt="Profile preview"
                    className="h-24 w-24 rounded-full object-cover ring-2 ring-primary/40"
                  />
                ) : null}
              </div>
              <Input value={form.preferredCity} onChange={(e) => updateField("preferredCity", e.target.value)} placeholder="Preferred partner city" />
              <select
                value={form.preferredAgeRange}
                onChange={(e) => updateField("preferredAgeRange", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Select preferred age range</option>
                {PREFERRED_AGE_RANGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={form.preferredProfession}
                onChange={(e) => updateField("preferredProfession", e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none transition-colors focus:border-primary"
              >
                <option value="">Select preferred profession</option>
                {PROFESSION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <textarea
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Short bio (optional)"
                className="min-h-28 w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary md:col-span-2"
              />
            </>
          ) : null}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={prevStep} disabled={step === 1} className="w-40">Back</Button>
          {step < totalSteps ? (
            <Button onClick={nextStep} className="w-40">Next Step</Button>
          ) : (
            <Button onClick={() => void submitProfile()} className="w-56">Save Profile & Continue</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
