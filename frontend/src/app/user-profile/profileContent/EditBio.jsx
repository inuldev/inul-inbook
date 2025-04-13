import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrUpdateUserBio } from "@/service/user.service";
import { Save } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { showSuccessToast, showErrorToast } from "@/lib/toastUtils";

const EditBio = ({ isOpen, onClose, initialData, id, fetchProfile }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: initialData,
  });
  // Reset form when initialData changes
  useEffect(() => {
    try {
      if (initialData) {
        // Safely extract data from initialData
        const safeInitialData = {
          about: initialData.about || "",
          relationship: initialData.relationship || "",
          phone: initialData.phone || "",
          website: initialData.website || "",
          // Simplified fields for location
          city: initialData.location?.city || "",
          country: initialData.location?.country || "",
          // Custom fields that might not match the model directly
          bioText: initialData.about || "",
          liveIn: "",
          hometown: initialData.hometown || "",
          workplace: "",
          education: "",
        };

        // Safely build liveIn string
        if (initialData.location?.city) {
          safeInitialData.liveIn = `${initialData.location.city}${
            initialData.location.country
              ? ", " + initialData.location.country
              : ""
          }`;
        }

        // Safely build workplace string
        if (
          initialData.work &&
          Array.isArray(initialData.work) &&
          initialData.work[0]
        ) {
          const company = initialData.work[0].company || "";
          const position = initialData.work[0].position || "";
          safeInitialData.workplace =
            company + (position ? ` - ${position}` : "");
        }

        // Safely build education string
        if (
          initialData.education &&
          Array.isArray(initialData.education) &&
          initialData.education[0]
        ) {
          const school = initialData.education[0].school || "";
          const degree = initialData.education[0].degree || "";
          safeInitialData.education = school + (degree ? ` - ${degree}` : "");
        }

        // Reset form with safe data
        reset(safeInitialData);

        console.log("Form reset with data:", safeInitialData);
      }
    } catch (error) {
      console.error("Error in EditBio useEffect:", error);
    }
  }, [initialData, reset]);

  const handleEditBio = async (data) => {
    try {
      if (!data) {
        console.error("No data provided to handleEditBio");
        showErrorToast("Gagal memperbarui profil: Data tidak valid");
        return;
      }

      console.log("Submitting bio data:", data);

      // Prepare data for API
      const bioData = {
        about: data.bioText || data.about || "",
        relationship: data.relationship || "",
        phone: data.phone || "",
        website: data.website || "",
        hometown: data.hometown || "",
        // Parse location from liveIn or city/country fields
        location: {
          city:
            data.city || (data.liveIn ? data.liveIn.split(",")[0]?.trim() : ""),
          country:
            data.country ||
            (data.liveIn && data.liveIn.includes(",")
              ? data.liveIn.split(",")[1]?.trim()
              : ""),
        },
      };

      // Safely create work array
      const workItem = {};
      if (data.workplace) {
        const parts = data.workplace.split("-");
        workItem.company = parts[0]?.trim() || "";
        workItem.position = parts.length > 1 ? parts[1]?.trim() : "";
        workItem.current = true;
      } else {
        workItem.company = "";
        workItem.position = "";
        workItem.current = true;
      }
      bioData.work = [workItem];

      // Safely create education array
      const educationItem = {};
      if (data.education) {
        const parts = data.education.split("-");
        educationItem.school = parts[0]?.trim() || "";
        educationItem.degree = parts.length > 1 ? parts[1]?.trim() : "";
        educationItem.current = false;
      } else {
        educationItem.school = "";
        educationItem.degree = "";
        educationItem.current = false;
      }
      bioData.education = [educationItem];

      console.log("Formatted bio data for API:", bioData);

      // Call API to update bio
      const updatedBio = await createOrUpdateUserBio(id, bioData);
      console.log("API response for bio update:", updatedBio);

      // Show success message
      showSuccessToast("Profil berhasil diperbarui");

      // Refresh profile data to get the latest changes
      await fetchProfile();

      // Close the dialog
      onClose();
    } catch (error) {
      console.error("Error creating or updating user bio:", error);
      showErrorToast("Gagal memperbarui profil: " + error.message);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Bio</DialogTitle>
          <DialogDescription className="sr-only"></DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            try {
              return handleSubmit(handleEditBio)(e);
            } catch (error) {
              console.error("Error in form submission:", error);
              showErrorToast("Gagal memperbarui profil: Terjadi kesalahan");
              return false;
            }
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bioText" className="text-right">
                Bio
              </Label>
              <Textarea
                id="bioText"
                placeholder="Ceritakan tentang diri Anda"
                className="col-span-3"
                {...register("bioText")}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                Kota
              </Label>
              <Input
                id="city"
                placeholder="Jakarta"
                className="col-span-3"
                {...register("city")}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="country" className="text-right">
                Negara
              </Label>
              <Input
                id="country"
                placeholder="Indonesia"
                className="col-span-3"
                {...register("country")}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="relationship" className="text-right">
                Status Hubungan
              </Label>
              <div className="col-span-3">
                <select
                  {...register("relationship")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Pilih status hubungan</option>
                  <option value="Single">Lajang</option>
                  <option value="In a relationship">Dalam Hubungan</option>
                  <option value="Engaged">Bertunangan</option>
                  <option value="Married">Menikah</option>
                  <option value="Complicated">Rumit</option>
                  <option value="Separated">Berpisah</option>
                  <option value="Divorced">Bercerai</option>
                  <option value="Widowed">Menduda/Menjanda</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="workplace" className="text-right">
                Tempat Kerja
              </Label>
              <Input
                id="workplace"
                placeholder="Perusahaan - Posisi"
                {...register("workplace")}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="education" className="text-right">
                Pendidikan
              </Label>
              <Input
                id="education"
                placeholder="Sekolah/Universitas - Gelar"
                {...register("education")}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Telepon
              </Label>
              <Input
                id="phone"
                placeholder="+62 812 3456 7890"
                {...register("phone")}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="website" className="text-right">
                Website
              </Label>
              <Input
                id="website"
                placeholder="https://example.com"
                {...register("website")}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hometown" className="text-right">
                Kota Asal
              </Label>
              <Input
                id="hometown"
                placeholder="Kota asal Anda"
                {...register("hometown")}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />{" "}
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBio;
