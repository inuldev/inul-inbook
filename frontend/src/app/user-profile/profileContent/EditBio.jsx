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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    if (initialData) {
      reset({
        about: initialData.about || "",
        relationship: initialData.relationship || "",
        phone: initialData.phone || "",
        website: initialData.website || "",
        // Simplified fields for location
        city: initialData.location?.city || "",
        country: initialData.location?.country || "",
        // Custom fields that might not match the model directly
        bioText: initialData.about || "",
        liveIn: initialData.location?.city
          ? `${initialData.location.city}, ${
              initialData.location.country || ""
            }`.trim()
          : "",
        hometown: initialData.hometown || "",
        workplace:
          initialData.work && initialData.work[0]
            ? `${initialData.work[0].company || ""} - ${
                initialData.work[0].position || ""
              }`.trim()
            : "",
        education:
          initialData.education && initialData.education[0]
            ? `${initialData.education[0].school || ""} - ${
                initialData.education[0].degree || ""
              }`.trim()
            : "",
      });
    }
  }, [initialData, reset]);

  const handleEditBio = async (data) => {
    try {
      // Prepare data for API
      const bioData = {
        about: data.bioText || data.about || "",
        relationship: data.relationship || "",
        phone: data.phone || "",
        website: data.website || "",
        // Parse location from liveIn
        location: {
          city:
            data.city || (data.liveIn ? data.liveIn.split(",")[0]?.trim() : ""),
          country:
            data.country ||
            (data.liveIn && data.liveIn.includes(",")
              ? data.liveIn.split(",")[1]?.trim()
              : ""),
        },
        // Simplified work and education arrays
        work: [
          {
            company: data.workplace ? data.workplace.split("-")[0]?.trim() : "",
            position:
              data.workplace && data.workplace.includes("-")
                ? data.workplace.split("-")[1]?.trim()
                : "",
            current: true,
          },
        ],
        education: [
          {
            school: data.education ? data.education.split("-")[0]?.trim() : "",
            degree:
              data.education && data.education.includes("-")
                ? data.education.split("-")[1]?.trim()
                : "",
            current: false,
          },
        ],
      };

      await createOrUpdateUserBio(id, bioData);
      showSuccessToast("Profil berhasil diperbarui");
      await fetchProfile();
      onClose();
    } catch (error) {
      console.error("Error creating or updating user bio:", error);
      showErrorToast("Gagal memperbarui profil");
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Bio</DialogTitle>
          <DialogDescription className="sr-only"></DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleEditBio)}>
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
              <Select {...register("relationship")}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Pilih status hubungan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Lajang</SelectItem>
                  <SelectItem value="In a relationship">
                    Dalam Hubungan
                  </SelectItem>
                  <SelectItem value="Engaged">Bertunangan</SelectItem>
                  <SelectItem value="Married">Menikah</SelectItem>
                  <SelectItem value="Complicated">Rumit</SelectItem>
                  <SelectItem value="Separated">Berpisah</SelectItem>
                  <SelectItem value="Divorced">Bercerai</SelectItem>
                  <SelectItem value="Widowed">Menduda/Menjanda</SelectItem>
                </SelectContent>
              </Select>
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
