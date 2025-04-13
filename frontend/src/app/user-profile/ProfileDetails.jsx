// import Image from "next/image";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Cake,
  GraduationCap,
  Heart,
  Home,
  Mail,
  MapPin,
  Phone,
  Rss,
  Globe,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatTanggal, formatDate } from "@/lib/utils";
import { usePostStore } from "@/store/usePostStore";
import EditPostForm from "../posts/EditPostForm";
import { Card, CardContent } from "@/components/ui/card";
import { showErrorToast, showSuccessToast } from "@/lib/toastUtils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import EditBio from "./profileContent/EditBio";
import PostsContent from "./profileContent/PostsContent";
// import MutualFriends from "./profileContent/MutualFriends";
import UserFriends from "./profileContent/UserFriends";

const ProfileDetails = ({
  activeTab,
  id,
  profileData,
  isOwner,
  fetchProfile,
}) => {
  const [likePosts, setLikePosts] = useState(new Set());
  const [isEditBioModel, setIsEditBioModel] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  const {
    userPosts,
    fetchUserPost,
    handleLikePost,
    handleCommentPost,
    handleSharePost,
  } = usePostStore();

  useEffect(() => {
    if (id) {
      fetchUserPost(id);
    }
  }, [id, fetchUserPost]);

  useEffect(() => {
    const saveLikes = localStorage.getItem("likePosts");
    if (saveLikes) {
      setLikePosts(new Set(JSON.parse(saveLikes)));
    }
  }, []);

  const handleLike = async (postId) => {
    const updatedLikePost = new Set(likePosts);
    if (updatedLikePost.has(postId)) {
      updatedLikePost.delete(postId);
      showErrorToast("Post unliked successfully");
    } else {
      updatedLikePost.add(postId);
      showSuccessToast("Post liked successfully");
    }
    setLikePosts(updatedLikePost);
    localStorage.setItem(
      "likePosts",
      JSON.stringify(Array.from(updatedLikePost))
    );

    try {
      await handleLikePost(postId);
      await fetchProfile();
    } catch (error) {
      console.error(error);
      showErrorToast("Failed to like or unlike the post");
    }
  };

  const tabContent = {
    posts: (
      <div className="flex flex-col lg:flex-row gap-6 ">
        <div className="w-full lg:w-[70%] space-y-6 mb-4">
          {userPosts?.map((post) => (
            <PostsContent
              key={post?._id}
              post={post}
              isLiked={likePosts.has(post?._id)}
              onLike={() => handleLike(post?._id)}
              onComment={async (comment) => {
                await handleCommentPost(post?._id, comment.text);
                await fetchProfile();
              }}
              onShare={async () => {
                await handleSharePost(post?._id);
                await fetchProfile();
              }}
              onEdit={(post) => {
                setEditingPost(post);
                setIsEditFormOpen(true);
              }}
            />
          ))}

          {/* Edit Post Form */}
          {isEditFormOpen && editingPost && (
            <EditPostForm
              isOpen={isEditFormOpen}
              onClose={() => {
                setIsEditFormOpen(false);
                setEditingPost(null);
              }}
              post={editingPost}
            />
          )}
        </div>
        <div className="w-full lg:w-[30%]">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-gray-300">
                Intro
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {profileData?.bio?.about}
              </p>
              <div className="space-y-2 mb-4 dark:text-gray-300">
                <div className="flex items-center">
                  <Home className="w-5 h-5 mr-2" />
                  <span> {profileData?.bio?.location?.city}</span>
                </div>
                <div className="flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  <span>{profileData?.bio?.relationship}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{profileData?.bio?.location?.country}</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  <span>
                    {profileData?.bio?.work && profileData.bio.work[0]
                      ? `${profileData.bio.work[0].company || ""} ${
                          profileData.bio.work[0].position
                            ? "- " + profileData.bio.work[0].position
                            : ""
                        }`.trim()
                      : ""}
                  </span>
                </div>
                <div className="flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  <span>
                    {profileData?.bio?.education && profileData.bio.education[0]
                      ? `${profileData.bio.education[0].school || ""} ${
                          profileData.bio.education[0].degree
                            ? "- " + profileData.bio.education[0].degree
                            : ""
                        }`.trim()
                      : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center mb-4 dark:text-gray-300">
                <Rss className="w-5 h-5 mr-2" />
                <span>Followed by {profileData?.followingCount} people</span>
              </div>
              {isOwner && (
                <Button
                  className="w-full "
                  onClick={() => setIsEditBioModel(true)}
                >
                  Edit Bio
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    about: (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold dark:text-gray-300">
                Tentang {profileData?.username}
              </h2>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditBioModel(true)}
                >
                  Edit Info
                </Button>
              )}
            </div>

            {/* Bio text */}
            {profileData?.bio?.about && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2 dark:text-gray-300">
                  Bio
                </h3>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {profileData.bio.about}
                </p>
              </div>
            )}

            {/* Work and Education */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 dark:text-gray-300">
                Pekerjaan dan Pendidikan
              </h3>
              <div className="space-y-4 dark:text-gray-300 pl-1">
                {profileData?.bio?.work &&
                  profileData.bio.work.length > 0 &&
                  profileData.bio.work[0].company && (
                    <div className="flex items-start">
                      <Briefcase className="w-5 h-5 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {profileData.bio.work[0].company}
                        </p>
                        {profileData.bio.work[0].position && (
                          <p className="text-gray-500 dark:text-gray-400">
                            {profileData.bio.work[0].position}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                {profileData?.bio?.education &&
                  profileData.bio.education.length > 0 &&
                  profileData.bio.education[0].school && (
                    <div className="flex items-start">
                      <GraduationCap className="w-5 h-5 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {profileData.bio.education[0].school}
                        </p>
                        {profileData.bio.education[0].degree && (
                          <p className="text-gray-500 dark:text-gray-400">
                            {profileData.bio.education[0].degree}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Contact and Basic Info */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 dark:text-gray-300">
                Kontak dan Info Dasar
              </h3>
              <div className="space-y-4 dark:text-gray-300 pl-1">
                {profileData?.bio?.location &&
                  (profileData.bio.location.city ||
                    profileData.bio.location.country) && (
                    <div className="flex items-center">
                      <Home className="w-5 h-5 mr-3" />
                      <span>
                        Tinggal di {profileData.bio.location.city}
                        {profileData.bio.location.city &&
                          profileData.bio.location.country &&
                          ", "}
                        {profileData.bio.location.country}
                      </span>
                    </div>
                  )}

                {profileData?.bio?.location?.country && (
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3" />
                    <span>Berasal dari {profileData.bio.location.country}</span>
                  </div>
                )}

                {profileData?.bio?.relationship && (
                  <div className="flex items-center">
                    <Heart className="w-5 h-5 mr-3" />
                    <span>
                      {profileData.bio.relationship === "Single" && "Lajang"}
                      {profileData.bio.relationship === "In a relationship" &&
                        "Dalam Hubungan"}
                      {profileData.bio.relationship === "Engaged" &&
                        "Bertunangan"}
                      {profileData.bio.relationship === "Married" && "Menikah"}
                      {profileData.bio.relationship === "Complicated" &&
                        "Rumit"}
                      {profileData.bio.relationship === "Separated" &&
                        "Berpisah"}
                      {profileData.bio.relationship === "Divorced" &&
                        "Bercerai"}
                      {profileData.bio.relationship === "Widowed" &&
                        "Menduda/Menjanda"}
                    </span>
                  </div>
                )}

                {profileData?.dateOfBirth && (
                  <div className="flex items-center">
                    <Cake className="w-5 h-5 mr-3" />
                    <span>
                      Lahir pada {formatTanggal(profileData.dateOfBirth)}
                    </span>
                  </div>
                )}

                {profileData?.email && (
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 mr-3" />
                    <span>{profileData.email}</span>
                  </div>
                )}

                {profileData?.bio?.phone && (
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 mr-3" />
                    <span>{profileData.bio.phone}</span>
                  </div>
                )}

                {profileData?.bio?.website && (
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 mr-3" />
                    <a
                      href={profileData.bio.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {profileData.bio.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    ),
    friends: <UserFriends id={id} isOwner={isOwner} />,
    photos: (() => {
      const [selectedPhoto, setSelectedPhoto] = useState(null);
      const [currentPage, setCurrentPage] = useState(1);
      const photosPerPage = 10;

      // Filter posts to get only images with valid mediaUrl
      const photosPosts =
        userPosts?.filter(
          (post) => post?.mediaType === "image" && post?.mediaUrl
        ) || [];

      // Calculate pagination
      const totalPages = Math.ceil(photosPosts.length / photosPerPage);
      const indexOfLastPhoto = currentPage * photosPerPage;
      const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
      const currentPhotos = photosPosts.slice(
        indexOfFirstPhoto,
        indexOfLastPhoto
      );

      // Handle page change
      const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 dark:text-gray-300">
                Foto
              </h2>
              {photosPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    {isOwner
                      ? "Anda belum memiliki foto. Unggah foto di halaman beranda."
                      : "Pengguna ini belum memiliki foto."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {currentPhotos.map((post) => (
                      <div
                        key={post?._id}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedPhoto(post)}
                      >
                        {post?.mediaUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={post.mediaUrl}
                              alt={post.content || "Foto pengguna"}
                              className="absolute inset-0 w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Tidak ada gambar
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                handlePageChange(Math.max(1, currentPage - 1))
                              }
                              className={
                                currentPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>

                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                handlePageChange(
                                  Math.min(totalPages, currentPage + 1)
                                )
                              }
                              className={
                                currentPage === totalPages
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Modal untuk melihat foto dalam ukuran penuh */}
          {selectedPhoto && (
            <Dialog
              open={!!selectedPhoto}
              onOpenChange={(open) => {
                if (!open) setSelectedPhoto(null);
              }}
              className="photo-dialog" /* Tambahkan class untuk styling khusus */
            >
              <DialogContent className="max-w-[90vw] md:max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-xl">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                    onClick={() => setSelectedPhoto(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>

                  <div className="relative max-h-[80vh] flex items-center justify-center bg-black bg-opacity-90 p-2 rounded-t-md">
                    {/* Tambahkan loading indicator */}
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                      <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                    {/* Gunakan img tag biasa untuk menghindari masalah dengan Next.js Image */}
                    <img
                      src={selectedPhoto.mediaUrl}
                      alt={selectedPhoto.content || "Foto pengguna"}
                      className="max-h-[70vh] max-w-full object-contain rounded-md z-10 relative"
                      style={{
                        display: "block",
                      }} /* Pastikan gambar ditampilkan sebagai block */
                      onLoad={(e) => {
                        // Sembunyikan loading indicator ketika gambar berhasil dimuat
                        const loadingIndicator =
                          e.target.parentNode.querySelector("div.absolute");
                        if (loadingIndicator)
                          loadingIndicator.style.display = "none";
                      }}
                      onError={(e) => {
                        console.error("Error loading image:", e);
                        // Gunakan data URI untuk placeholder image
                        e.target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f0f0f0'/%3E%3Ctext x='400' y='300' font-family='Arial' font-size='24' text-anchor='middle' fill='%23999999'%3EGambar Tidak Tersedia%3C/text%3E%3C/svg%3E";
                        e.target.onerror = null; // Prevent infinite loop
                      }}
                    />
                  </div>

                  {selectedPhoto.content && (
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-b-md">
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                        {selectedPhoto.content}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(selectedPhoto.createdAt)}
                        </p>
                        {selectedPhoto.user && (
                          <p className="text-sm text-blue-500 dark:text-blue-400">
                            Diunggah oleh:{" "}
                            {selectedPhoto.user.username || "Pengguna"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>
      );
    })(),
  };
  return (
    <div>
      {tabContent[activeTab] || null}
      {profileData && (
        <EditBio
          isOpen={isEditBioModel}
          onClose={() => setIsEditBioModel(false)}
          fetchProfile={fetchProfile}
          initialData={profileData?.bio || {}}
          id={id}
        />
      )}
    </div>
  );
};

export default ProfileDetails;
