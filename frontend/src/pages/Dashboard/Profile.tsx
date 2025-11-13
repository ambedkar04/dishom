import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile, fetchCurrentUser } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import Menubar from "@/components/Menubar";
import {
  Camera,
  Save,
  Edit3,
  User,
  Phone,
  Mail,
  BookOpen,
  Award,
  MapPin,
} from "lucide-react";

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  pincode: string;
  currentClass: string;
  townVillage: string;
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    // Personal Information
    fullName: "",
    email: "",
    phone: "",

    // Address Information
    state: "",
    district: "",
    pincode: "",
    townVillage: "",

    // Educational Information
    currentClass: "",
  });

  useEffect(() => {
    // Hydrate form from user only when not editing, so typing isn't reset
    if (user && !isEditing) {
      setFormData({
        fullName: (user.full_name as string) || "",
        email: user.email || "",
        phone: (user.mobile_number as string) || "",
        state: user.profile?.state || "",
        district: user.profile?.district || "",
        pincode: user.profile?.pincode || "",
        currentClass: user.profile?.current_class || "",
        townVillage: user.profile?.village || "",
      });
      if (user.profile?.profile_image) {
        setProfileImage(user.profile.profile_image);
      }
    }
  }, [user, isEditing]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setProfileImage(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      // Send only fields the backend expects
      const payload: Record<string, unknown> = {
        fullName: formData.fullName,
        email: formData.email,
        state: formData.state,
        district: formData.district,
        pincode: formData.pincode,
        currentClass: formData.currentClass,
        townVillage: formData.townVillage,
      };
      if (profileImage) {
        payload.profile_image = profileImage;
      }
      const response = await updateUserProfile(payload);
      if (response.data) {
        if ((response.data as Record<string, unknown>).warning) {
          alert(String((response.data as Record<string, unknown>).warning));
        }
        // Refetch from DB to ensure canonical state is shown
        try {
          const fresh = await fetchCurrentUser();
          setUser(fresh);
        } catch {
          setUser(response.data as import('@/contexts/AuthContext').User); // Type assertion to handle response data
        }
        setIsEditing(false);
        alert("Profile updated successfully!");
        navigate("/study");
        // No hard reload to preserve editing flow; context state is already updated
      } else {
        const msg = typeof response.error === 'string'
          ? response.error
          : (response.error as Record<string, unknown>)?.detail || JSON.stringify(response.error || {});
        alert(`Failed to update profile. ${msg ? `\n${msg}` : 'Please try again.'}`);
        console.error("Profile update error:", response.error);
      }
    } catch (error) {
      alert("An error occurred while updating your profile.");
      console.error("Network error:", error);
    }
  };

  const classOptions = [
    "BCECE",
    "DCECE",
    "UG - Botany",
    "UG - Zoology",
    "PG - Botany",
    "PG - Zoology",
  ];

  const stateOptions = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Delhi",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  interface InputFieldProps {
    label: string;
    field: keyof FormData;
    type?: string;
    options?: string[];
    placeholder?: string;
    icon?: React.ReactNode;
    alwaysDisabled?: boolean;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    pattern?: string;
    maxLength?: number;
  }

  const InputField: React.FC<InputFieldProps> = ({
    label,
    field,
    type = "text",
    options,
    placeholder = "",
    icon,
    alwaysDisabled = false,
    inputMode,
    pattern,
    maxLength,
  }) => {
    const value = formData[field] !== undefined && formData[field] !== null ? String(formData[field]) : "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      let v = e.target.value;
      if (field === "fullName" || field === "district" || field === "townVillage") {
        v = v.replace(/[^a-zA-Z\s]/g, ""); // letters and spaces only
        v = v.replace(/\s{2,}/g, " "); // collapse multiple spaces
        v = v.slice(0, 150);
      } else if (field === "email") {
        const at = v.indexOf("@");
        if (at !== -1) {
          v = v.slice(0, at);
        }
      } else if (field === "pincode") {
        v = v.replace(/\D/g, "").slice(0, 6);
      }
      handleInputChange(field, v);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const v = e.target.value.trim();
      if (field === "email") {
        if (!v) return;
        // Removed the @Gmail.com restriction
      }
      if (v !== formData[field]) {
        handleInputChange(field, v);
      }
    };

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {icon}
          {label}
        </label>
        {options ? (
          <select
            value={value}
            onChange={handleChange}
            disabled={alwaysDisabled || !isEditing}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">{placeholder || `Select ${label}`}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={alwaysDisabled || !isEditing}
            inputMode={inputMode}
            pattern={pattern}
            maxLength={maxLength}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="sticky top-0 z-50 w-full bg-white shadow-sm">
          <Menubar className="border-b border-gray-200" />
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-3 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Profile Image */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-16 h-16 text-white" />
                      )}
                    </div>
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
  
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                      {formData.fullName || "Student"}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {formData.currentClass || "Exam not specified"}
                    </p>
                  </div>
                </div>
  
                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
  
            {/* Profile Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal + Address Information */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <User className="w-6 h-6 text-blue-500" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InputField
                    label="Full Name *"
                    field="fullName"
                    icon={<User className="w-4 h-4" />}
                    placeholder="Enter full name"
                  />
                  <InputField
                    label="Phone Number *"
                    field="phone"
                    type="tel"
                    placeholder="Enter mobile number"
                    icon={<Phone className="w-4 h-4" />}
                    alwaysDisabled
                  />
                  <InputField
                    label="Email Address *"
                    field="email"
                    icon={<Mail className="w-4 h-4" />}
                    placeholder="Enter email"
                  />
                  <InputField
                    label="Exam"
                    field="currentClass"
                    options={classOptions}
                    icon={<BookOpen className="w-4 h-4" />}
                  />
                  <InputField
                    label="State *"
                    field="state"
                    options={stateOptions}
                    icon={<MapPin className="w-4 h-4" />}
                  />
                  <InputField
                    label="District *"
                    field="district"
                    icon={<MapPin className="w-4 h-4" />}
                    placeholder="Enter district"
                  />
                  <InputField
                    label="Town / Village"
                    field="townVillage"
                    icon={<MapPin className="w-4 h-4" />}
                    placeholder="Enter Town / Village"
                  />
                  <InputField
                    label="PIN Code *"
                    field="pincode"
                    icon={<MapPin className="w-4 h-4" />}
                    placeholder="Enter PIN code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                  />
                </div>
              </div>
  
              {/* Password Update */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Award className="w-6 h-6 text-red-500" />
                  Password Update
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 8 characters long
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      disabled={!isEditing}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  {isEditing && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">
                        Password Requirements:
                      </h4>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        <li>• At least 8 characters long</li>
                        <li>• Contains at least one uppercase letter</li>
                        <li>• Contains at least one lowercase letter</li>
                        <li>• Contains at least one number</li>
                        <li>• Contains at least one special character (!@#$%^&*)</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
