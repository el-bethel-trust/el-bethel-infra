import "./App.css";

import { useState, useEffect } from "preact/hooks";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { TabNavigation } from "./components/TabNavigation";
import { MemberList } from "./components/MemberList";
import { SubAdminTab } from "./components/SubAdminTab";
import { MemberDetails } from "./components/MemberDetails";
import type { Member, SubAdmins, StreamFilter } from "./types";
import { PinAuth } from "./components/PinAuth";
import { showToast } from "./utils";
import * as api from "./api";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "subadmins">(
    "members",
  );
  const [activeStreamFilter, setActiveStreamFilter] =
    useState<StreamFilter>("ALL");
  const [members, setMembers] = useState<Member[]>([]);
  const [subAdmins, setSubAdmins] = useState<SubAdmins>({
    MALE: null,
    FEMALE: null,
    FUTURE: null,
    SUNDAY_CLASS_TEACHER: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isCreatingMember, setIsCreatingMember] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAuthentication = (success: boolean) => {
    setIsAuthenticated(success);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [fetchedMembers, fetchedSubAdmins] = await Promise.all([
          api.getMembers(),
          api.getSubAdmins(),
        ]);
        setMembers(fetchedMembers);
        setSubAdmins(fetchedSubAdmins);
      } catch (err: any) {
        setError(err.message || "Failed to fetch initial data.");
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleSubAdminSave = async (updatedSubAdmins: SubAdmins) => {
    const savedSubAdmins = await api.updateSubAdmins(updatedSubAdmins);
    setSubAdmins(savedSubAdmins);
  };

  const handleMemberSave = async (memberToSave: Member) => {
    if (isCreatingMember) {
      const { id, ...newMemberData } = memberToSave; // Exclude the placeholder id
      const createdMember = await api.createMember(newMemberData);
      setMembers([...members, createdMember]);
    } else {
      const updatedMember = await api.updateMember(
        memberToSave.id,
        memberToSave,
      );
      setMembers(
        members.map((m) => (m.id === updatedMember.id ? updatedMember : m)),
      );
    }
  };

  const handleMemberDelete = async (memberId: number) => {
    const isSubAdmin = Object.values(subAdmins).includes(memberId);
    if (isSubAdmin) {
      const streams = Object.entries(subAdmins)
        .filter(([_, id]) => id === memberId)
        .map(([stream]) => stream);
      await showToast(
        `This member is a sub-admin for: ${streams.join(", ")}. Please assign different sub-admins for these streams before deleting.`,
      );
      return;
    }

    try {
      await api.deleteMember(memberId);
      setMembers(members.filter((m) => m.id !== memberId));
      handleCloseModal();
    } catch (err: any) {
      await showToast(err.message || "Failed to delete member.");
    }
  };

  const handleCloseModal = () => {
    setSelectedMember(null);
    setIsCreatingMember(false);
  };

  const handleOpenCreateModal = () => {
    setIsCreatingMember(true);
    setSelectedMember(null);
  };

  const handleOpenEditModal = (member: Member) => {
    setIsCreatingMember(false);
    setSelectedMember(member);
  };

  if (!isAuthenticated) {
    return (
      <PinAuth
        onAuthenticate={handleAuthentication}
        verifyAdminPin={api.verifyAdminPin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {isLoading && (
            <div className="text-center p-8">Loading members...</div>
          )}
          {error && (
            <div className="text-center p-8 text-red-600">Error: {error}</div>
          )}
          {!isLoading && !error && (
            <>
              {activeTab === "members" ? (
                <MemberList
                  members={members}
                  activeStreamFilter={activeStreamFilter}
                  searchTerm={searchTerm}
                  onFilterChange={setActiveStreamFilter}
                  onSearchChange={setSearchTerm}
                  onMemberSelect={handleOpenEditModal}
                  onCreateMember={handleOpenCreateModal}
                />
              ) : (
                <SubAdminTab
                  members={members}
                  subAdmins={subAdmins}
                  onSave={handleSubAdminSave}
                />
              )}
            </>
          )}
        </div>
      </main>

      <Footer />

      {(selectedMember || isCreatingMember) && (
        <MemberDetails
          member={selectedMember}
          onClose={handleCloseModal}
          onSave={handleMemberSave}
          onDelete={handleMemberDelete}
          isCreating={isCreatingMember}
        />
      )}
    </div>
  );
}
