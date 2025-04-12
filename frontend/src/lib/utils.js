import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format waktu relatif seperti "5 menit yang lalu", "1 jam yang lalu", dll
export const formatDate = (date) => {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now - postDate) / 1000);

  // Kurang dari 1 menit
  if (diffInSeconds < 60) {
    return "Baru saja";
  }

  // Kurang dari 1 jam
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} menit yang lalu`;
  }

  // Kurang dari 24 jam
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} jam yang lalu`;
  }

  // Kurang dari 7 hari
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} hari yang lalu`;
  }

  // Kurang dari 30 hari
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} minggu yang lalu`;
  }

  // Lebih dari 30 hari, tampilkan tanggal lengkap
  return formatTanggal(date);
};

// Format tanggal dalam format DD/MM/YYYY (contoh: 15/08/2023)
export const formatDateInDDMMYYY = (date) => {
  if (!date) return "";
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Date(date).toLocaleDateString("id-ID", options);
};

// Fungsi untuk mendapatkan nama hari dalam bahasa Indonesia
const getNamaHari = (dayIndex) => {
  const hariIndonesia = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  return hariIndonesia[dayIndex];
};

// Fungsi untuk mendapatkan nama bulan dalam bahasa Indonesia
const getNamaBulan = (monthIndex) => {
  const bulanIndonesia = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return bulanIndonesia[monthIndex];
};

// Fungsi untuk memformat tanggal lengkap dalam format Indonesia
export const formatTanggal = (date) => {
  const tanggal = new Date(date);
  const hari = getNamaHari(tanggal.getDay());
  const tanggalNum = tanggal.getDate();
  const bulan = getNamaBulan(tanggal.getMonth());
  const tahun = tanggal.getFullYear();

  return `${hari}, ${tanggalNum} ${bulan} ${tahun}`;
};

// Fungsi untuk memformat tanggal dan waktu lengkap dalam format Indonesia
export const formatTanggalWaktu = (date) => {
  const tanggal = new Date(date);
  const hari = getNamaHari(tanggal.getDay());
  const tanggalNum = tanggal.getDate();
  const bulan = getNamaBulan(tanggal.getMonth());
  const tahun = tanggal.getFullYear();

  // Format waktu dengan leading zero jika perlu
  const jam = String(tanggal.getHours()).padStart(2, "0");
  const menit = String(tanggal.getMinutes()).padStart(2, "0");

  return `${hari}, ${tanggalNum} ${bulan} ${tahun} ${jam}:${menit} WIB`;
};
