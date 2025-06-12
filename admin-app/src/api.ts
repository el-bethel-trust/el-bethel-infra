import type { Member, SubAdmins } from './types';

const BASE_URL = import.meta.env.PUBLIC_ENDPOINT || '';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage =
      errorData?.message || `Error: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
}

export const verifyAdminPin = async (
  pin: string,
): Promise<{ success: boolean }> => {
  const response = await fetch(`${BASE_URL}/admin/check-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  return handleResponse<{ success: boolean }>(response);
};

export const getMembers = async (): Promise<Member[]> => {
  const response = await fetch(`${BASE_URL}/admin/members`);
  return handleResponse<Member[]>(response);
};

export const getSubAdmins = async (): Promise<SubAdmins> => {
  const response = await fetch(`${BASE_URL}/admin/sub-admins`);
  return handleResponse<SubAdmins>(response);
};

export const updateSubAdmins = async (
  subAdminsData: SubAdmins,
): Promise<SubAdmins> => {
  const response = await fetch(`${BASE_URL}/admin/sub-admins`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subAdminsData),
  });
  return handleResponse<SubAdmins>(response);
};

export const createMember = async (
  memberData: Omit<Member, 'id'>,
): Promise<Member> => {
  const response = await fetch(`${BASE_URL}/admin/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memberData),
  });
  return handleResponse<Member>(response);
};

export const updateMember = async (
  id: number,
  memberData: Member,
): Promise<Member> => {
  const response = await fetch(`${BASE_URL}/admin/members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memberData),
  });
  return handleResponse<Member>(response);
};

export const deleteMember = async (id: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/admin/members/${id}`, {
    method: 'DELETE',
  });
  await handleResponse<void>(response);
};
