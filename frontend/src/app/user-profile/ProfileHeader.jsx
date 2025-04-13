"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, PenLine, Save, Upload, X, AlertCircle } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import userStore from "@/store/userStore";
import {
  updateUserCoverPhoto,
  updateUserProfile,
} from "@/service/user.service";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";

const ProfileHeader = ({
  id,
  profileData,
  isOwner,
  setProfileData,
  fetchProfile,
}) => {
  const [isEditProfileModel, setIsEditProfileModel] = useState(false);
  const [isEditCoverModel, setIsEditCoverModel] = useState(false);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setUser } = userStore();

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      username: profileData?.username,
      dateOfBirth: profileData?.dateOfBirth?.split("T")[0],
      gender: profileData?.gender,
    },
  });

  const profileImageInputRef = useRef();
  const coverImageInputRef = useRef();

  const onSubmitProfile = async (data) => {
    try {
      setError("");
      setLoading(true);

      // Validate inputs
      if (!data.username || data.username.trim() === "") {
        setError("Nama pengguna tidak boleh kosong");
        return;
      }

      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("dateOfBirth", data.dateOfBirth);
      formData.append("gender", data.gender);

      if (profilePictureFile) {
        // Validate file size (max 5MB)
        if (profilePictureFile.size > 5 * 1024 * 1024) {
          setError("Ukuran foto profil tidak boleh lebih dari 5MB");
          return;
        }
        formData.append("profilePicture", profilePictureFile);
      }

      const updateProfile = await updateUserProfile(id, formData);

      // Update local state with the new profile data
      if (profilePictureFile) {
        // If we updated the profile picture, make sure it's reflected in the UI
        const updatedProfileData = {
          ...profileData,
          ...updateProfile,
          profilePicture:
            updateProfile.profilePicture || profileData.profilePicture,
        };
        setProfileData(updatedProfileData);

        // Update user in userStore to refresh all components using the user data
        setUser({
          ...updateProfile,
          profilePicture:
            updateProfile.profilePicture || profileData.profilePicture,
        });

        // Force a refresh of the user data in the store
        await userStore.getState().getCurrentUser();
      } else {
        setProfileData({ ...profileData, ...updateProfile });
        setUser(updateProfile);
      }

      setIsEditProfileModel(false);
      setProfilePicturePreview(null);
      setProfilePictureFile(null);
      await fetchProfile();
      showSuccessToast("Profil berhasil diperbarui");
    } catch (error) {
      console.error("Error updating user profile:", error);
      showErrorToast("Gagal memperbarui profil");
      setError("Terjadi kesalahan saat memperbarui profil");
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);

      const previewUrl = URL.createObjectURL(file);
      setProfilePicturePreview(previewUrl);
    }
  };

  const onSubmitCoverPhoto = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);

      const formData = new FormData();
      if (coverPhotoFile) {
        // Validate file size (max 5MB)
        if (coverPhotoFile.size > 5 * 1024 * 1024) {
          setError("Ukuran foto sampul tidak boleh lebih dari 5MB");
          return;
        }
        formData.append("coverPhoto", coverPhotoFile);
      } else {
        setError("Silakan pilih foto sampul terlebih dahulu");
        return;
      }

      const updateProfile = await updateUserCoverPhoto(id, formData);

      // Make sure the coverPhoto is updated in the UI
      if (updateProfile && updateProfile.coverPhoto) {
        setProfileData({
          ...profileData,
          coverPhoto: updateProfile.coverPhoto,
        });

        // Update user in userStore to refresh all components using the user data
        setUser({
          ...updateProfile,
          coverPhoto: updateProfile.coverPhoto,
        });

        // Force a refresh of the user data in the store
        await userStore.getState().getCurrentUser();
      }

      setIsEditCoverModel(false);
      setCoverPhotoFile(null);
      setCoverPhotoPreview(null);
      showSuccessToast("Foto sampul berhasil diperbarui");

      // Refresh profile data to ensure we have the latest version
      await fetchProfile();
    } catch (error) {
      console.error("Error updating user cover photo:", error);
      showErrorToast("Gagal memperbarui foto sampul");
      setError("Terjadi kesalahan saat memperbarui foto sampul");
    } finally {
      setLoading(false);
    }
  };

  const handleCoverPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverPhotoFile(file);

      const previewUrl = URL.createObjectURL(file);
      setCoverPhotoPreview(previewUrl);
    }
  };

  return (
    <div className="relative">
      <div className="relative h-64 md:h-80 bg-gray-300 overflow-hidden">
        {profileData?.coverPhoto ? (
          <div className="relative w-full h-full">
            <Image
              src={profileData.coverPhoto}
              alt="cover"
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400">
              Tidak ada foto sampul
            </span>
          </div>
        )}
        {isOwner && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <Button
              className="bg-white/80 hover:bg-white dark:bg-gray-800 hover:dark:bg-gray-700 shadow-md flex items-center"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditCoverModel(true)}
            >
              <Camera className="mr-2 h-4 w-4" />
              <span>Edit Foto Sampul</span>
            </Button>
          </div>
        )}
      </div>
      {/* profile section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end md:space-x-5">
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-700">
              <AvatarImage
                src={profileData?.profilePicture || ""}
                alt={profileData?.username || "User"}
              />
              <AvatarFallback className="dark:bg-gray-400">
                {profileData?.username
                  ?.split(" ")
                  .map((name) => name[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <div
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer"
                onClick={() => setIsEditProfileModel(true)}
              >
                <Camera className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-6 w-6" />
              </div>
            )}
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-left flex-grow">
            <h1 className="text-3xl font-bold">{profileData?.username}</h1>
            <p className="text-gray-400 font-semibold">
              {profileData?.followerCount} teman
            </p>
          </div>
          {isOwner && (
            <Button
              className="mt-4 md:mt-0 cursor-pointer"
              onClick={() => setIsEditProfileModel(true)}
            >
              <PenLine className="w-4 h-4 mr-2" />
              Edit Profil
            </Button>
          )}
        </div>
      </div>

      {/* edit profile model */}
      <AnimatePresence>
        {isEditProfileModel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className=" bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Edit Profil
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditProfileModel(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form
                className="space-y-4"
                onSubmit={handleSubmit(onSubmitProfile)}
              >
                {error && (
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-300" />
                    <p className="text-sm text-red-500 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                )}
                <div className="flex flex-col items-center mb-4">
                  <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-700 mb-2">
                    <AvatarImage
                      src={profilePicturePreview || profileData?.profilePicture}
                      alt={profileData?.username}
                    />
                    <AvatarFallback className="dark:bg-gray-400">
                      {profileData?.username
                        ?.split(" ")
                        .map((name) => name[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={profileImageInputRef}
                    onChange={handleProfilePictureChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => profileImageInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Ganti Foto Profil
                  </Button>
                </div>
                <div>
                  <Label htmlFor="username">Nama Pengguna</Label>
                  <Input id="username" {...register("username")} />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register("dateOfBirth")}
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Jenis Kelamin</Label>
                  <Select
                    onValueChange={(value) => setValue("gender", value)}
                    defaultValue={profileData?.gender}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Laki-laki</SelectItem>
                      <SelectItem value="female">Perempuan</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-400 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />{" "}
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* edit cover model */}
      <AnimatePresence>
        {isEditCoverModel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className=" bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Edit Foto Sampul
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditCoverModel(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form className="space-y-4">
                {error && (
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-300" />
                    <p className="text-sm text-red-500 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                )}
                <div className="flex flex-col items-center mb-4">
                  {coverPhotoPreview && (
                    <img
                      src={coverPhotoPreview}
                      alt="cover-photo"
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={coverImageInputRef}
                    onChange={handleCoverPhotoChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => coverImageInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pilih Foto Sampul Baru
                  </Button>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-400 text-white"
                  onClick={onSubmitCoverPhoto}
                  disabled={!coverPhotoFile}
                  type="button"
                >
                  <Save className="w-4 h-4 mr-2" />{" "}
                  {loading ? "Menyimpan..." : "Simpan Foto Sampul"}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileHeader;
