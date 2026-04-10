import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PrinterIcon } from 'lucide-react';
import { Logo } from '../../components/Logo';
import { api } from '../../app/api';

type PrintableCustomer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  gender: string;
  address: string;
  officeAddress: string;
  lga: string;
  state: string;
  nextOfKin: {
    name: string;
    phone: string;
    relationship: string;
  };
  group: {
    name: string;
    id: string;
    role: string;
  };
  branch: string;
  dateJoined: string;
  guarantors: Array<{
    name: string;
    phone: string;
    address: string;
    relationship: string;
    occupation: string;
    bvn: string;
  }>;
  reference: {
    name: string;
    phone: string;
    address: string;
    relationship: string;
    occupation: string;
    yearsKnown: string;
  };
  kyc: {
    bvn: { number: string; status: string };
    nin: { number: string; status: string };
    biometric: { status: string };
  };
};

const emptyPrintableCustomer = (id: string): PrintableCustomer => ({
  id,
  name: 'Unknown Customer',
  phone: '-',
  email: '-',
  dob: '-',
  gender: '-',
  address: '-',
  officeAddress: '-',
  lga: '-',
  state: '-',
  nextOfKin: {
    name: '-',
    phone: '-',
    relationship: '-',
  },
  group: {
    name: '-',
    id: '-',
    role: '-',
  },
  branch: '-',
  dateJoined: '-',
  guarantors: Array.from({ length: 3 }, () => ({
    name: '-',
    phone: '-',
    address: '-',
    relationship: '-',
    occupation: '-',
    bvn: '-',
  })),
  reference: {
    name: '-',
    phone: '-',
    address: '-',
    relationship: '-',
    occupation: '-',
    yearsKnown: '-',
  },
  kyc: {
    bvn: { number: '-', status: 'Pending' },
    nin: { number: '-', status: 'Pending' },
    biometric: { status: 'Pending' },
  },
});

const extractItem = <T,>(response: unknown): T | null => {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const source = response as { data?: unknown; payload?: unknown; item?: unknown };
  const candidates = [source.data, source.payload, source.item];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate as T;
    }
  }

  return null;
};

const maskBvn = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim().length < 4) {
    return '-';
  }
  return `****${value.trim().slice(-4)}`;
};

const mapCustomerForPrint = (raw: unknown, fallbackId: string): PrintableCustomer => {
  const fallback = emptyPrintableCustomer(fallbackId);
  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const source = raw as Record<string, unknown>;
  const firstName = typeof source.firstName === 'string' ? source.firstName : '';
  const lastName = typeof source.lastName === 'string' ? source.lastName : '';
  const joinedName = `${firstName} ${lastName}`.trim();
  const nextOfKin =
    typeof source.nok === 'object' && source.nok !== null ? (source.nok as Record<string, unknown>) : {};
  const ref =
    typeof source.reference === 'object' && source.reference !== null
      ? (source.reference as Record<string, unknown>)
      : {};

  const guarantorSources = [source.guarantor1, source.guarantor2, source.guarantor3].map((item) =>
    typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {},
  );

  const dateOfBirth =
    typeof source.dateOfBirth === 'string' && source.dateOfBirth.includes('T')
      ? source.dateOfBirth.split('T')[0]
      : typeof source.dateOfBirth === 'string'
      ? source.dateOfBirth
      : '-';

  return {
    id:
      (typeof source.id === 'string' && source.id) ||
      (typeof source._id === 'string' && source._id) ||
      fallback.id,
    name:
      (typeof source.fullName === 'string' && source.fullName.trim().length > 0
        ? source.fullName
        : joinedName) || fallback.name,
    phone:
      (typeof source.phoneNumber === 'string' && source.phoneNumber) ||
      (typeof source.phone === 'string' && source.phone) ||
      fallback.phone,
    email: (typeof source.email === 'string' && source.email) || fallback.email,
    dob: dateOfBirth,
    gender: (typeof source.gender === 'string' && source.gender) || fallback.gender,
    address:
      (typeof source.residentialAddress === 'string' && source.residentialAddress) ||
      (typeof source.address === 'string' && source.address) ||
      fallback.address,
    officeAddress: (typeof source.officeAddress === 'string' && source.officeAddress) || fallback.officeAddress,
    lga: (typeof source.lga === 'string' && source.lga) || fallback.lga,
    state: (typeof source.state === 'string' && source.state) || fallback.state,
    nextOfKin: {
      name: (typeof nextOfKin.fullName === 'string' && nextOfKin.fullName) || fallback.nextOfKin.name,
      phone: (typeof nextOfKin.phoneNumber === 'string' && nextOfKin.phoneNumber) || fallback.nextOfKin.phone,
      relationship:
        (typeof nextOfKin.relationship === 'string' && nextOfKin.relationship) || fallback.nextOfKin.relationship,
    },
    group: {
      name: (typeof source.groupName === 'string' && source.groupName) || fallback.group.name,
      id: (typeof source.groupId === 'string' && source.groupId) || fallback.group.id,
      role: '-',
    },
    branch:
      (typeof source.branchName === 'string' && source.branchName) ||
      (typeof source.branch === 'string' && source.branch) ||
      fallback.branch,
    dateJoined:
      typeof source.createdAt === 'string' && source.createdAt.includes('T')
        ? source.createdAt.split('T')[0]
        : typeof source.createdAt === 'string'
        ? source.createdAt
        : fallback.dateJoined,
    guarantors: guarantorSources.map((guarantor, index) => ({
      name: (typeof guarantor.fullName === 'string' && guarantor.fullName) || fallback.guarantors[index].name,
      phone: (typeof guarantor.phoneNumber === 'string' && guarantor.phoneNumber) || fallback.guarantors[index].phone,
      address: (typeof guarantor.address === 'string' && guarantor.address) || fallback.guarantors[index].address,
      relationship:
        (typeof guarantor.relationship === 'string' && guarantor.relationship) || fallback.guarantors[index].relationship,
      occupation: (typeof guarantor.occupation === 'string' && guarantor.occupation) || fallback.guarantors[index].occupation,
      bvn: '-',
    })),
    reference: {
      name: (typeof ref.name === 'string' && ref.name) || fallback.reference.name,
      phone: (typeof ref.phone === 'string' && ref.phone) || fallback.reference.phone,
      address: (typeof ref.address === 'string' && ref.address) || fallback.reference.address,
      relationship: (typeof ref.relationship === 'string' && ref.relationship) || fallback.reference.relationship,
      occupation: (typeof ref.occupation === 'string' && ref.occupation) || fallback.reference.occupation,
      yearsKnown: (typeof ref.yearsKnown === 'string' && ref.yearsKnown) || fallback.reference.yearsKnown,
    },
    kyc: {
      bvn: {
        number: maskBvn(source.bvn),
        status: typeof source.bvnVerified === 'boolean' ? (source.bvnVerified ? 'Verified' : 'Pending') : 'Pending',
      },
      nin: {
        number: typeof source.nin === 'string' && source.nin.trim().length > 0 ? maskBvn(source.nin) : '-',
        status: 'Pending',
      },
      biometric: {
        status: typeof source.biometricVerified === 'boolean' ? (source.biometricVerified ? 'Captured' : 'Pending') : 'Pending',
      },
    },
  };
};
function FormField({ label, value }: {label: string;value: string;}) {
  return (
    <div className="border border-gray-300 px-3 py-2">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-gray-900 font-medium mt-0.5">{value || '—'}</p>
    </div>);

}
function SectionHeader({ title }: {title: string;}) {
  return (
    <div className="bg-gray-100 border border-gray-300 px-3 py-2 mt-6 first:mt-0">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
        {title}
      </h3>
    </div>);

}
export function CustomerPrintPage() {
  const { id } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const routeId = id || '';
  const [customer, setCustomer] = useState<PrintableCustomer>(emptyPrintableCustomer(routeId || 'customer'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCustomer = async () => {
      if (!routeId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get(`/customers/${encodeURIComponent(routeId)}`);
        const payload = extractItem<Record<string, unknown>>(response);
        const mapped = mapCustomerForPrint(payload, routeId);

        if (!isMounted) {
          return;
        }

        setCustomer(mapped);
      } catch {
        if (isMounted) {
          setCustomer(emptyPrintableCustomer(routeId));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCustomer();

    return () => {
      isMounted = false;
    };
  }, [routeId]);

  const canPrint = useMemo(() => !isLoading, [isLoading]);

  const today = new Date().toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Action Bar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 lg:px-8 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(`/customers/${customer.id}`)}
          className="flex items-center gap-2 text-sm font-body text-gray-500 hover:text-primary transition-colors">
          
          <ArrowLeftIcon size={16} />
          Back to Customer Profile
        </button>
        <button
          onClick={() => window.print()}
          disabled={!canPrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-heading font-bold rounded-lg hover:bg-accent/90 transition-colors">
          
          <PrinterIcon size={16} />
          {canPrint ? 'Print Document' : 'Loading...'}
        </button>
      </div>

      {/* Printable Content */}
      <div className="max-w-4xl mx-auto bg-white p-8 lg:p-12 my-6 print:my-0 print:shadow-none shadow-sm">
        {/* Document Header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex items-start justify-between gap-6">
            {/* Left: Logo */}
            <div className="flex-shrink-0 flex items-start pt-1">
              <Logo width={80} height={80} />
            </div>

            {/* Center: Bank Info */}
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold uppercase tracking-wider text-gray-900">
                BCKash Microfinance Bank
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                15 Broad Street, Lagos Island, Lagos, Nigeria
              </p>
              <h2 className="text-lg font-bold uppercase tracking-wider text-gray-800 mt-3">
                Customer Data Form
              </h2>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Form No: CDF-{customer.id}</span>
                <span>Date Generated: {today}</span>
              </div>
            </div>

            {/* Right: Passport Photo Box */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="w-[100px] h-[128px] border-2 border-dashed border-gray-400 flex items-center justify-center bg-gray-50">
                <span className="text-[9px] text-gray-400 text-center px-1 leading-tight">
                  Affix Passport
                  <br />
                  Photograph
                </span>
              </div>
              <p className="text-[9px] text-gray-500 mt-1.5 font-medium uppercase tracking-wide">
                Passport Photograph
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Personal Information */}
        <SectionHeader title="Section 1 — Personal Information" />
        <div className="grid grid-cols-2">
          <FormField label="Full Name" value={customer.name} />
          <FormField label="Customer ID" value={customer.id} />
          <FormField label="Phone Number" value={customer.phone} />
          <FormField label="Email Address" value={customer.email} />
          <FormField label="Date of Birth" value={customer.dob} />
          <FormField label="Gender" value={customer.gender} />
          <div className="col-span-2">
            <FormField label="Residential Address" value={customer.address} />
          </div>
          <FormField label="LGA" value={customer.lga} />
          <FormField label="State" value={customer.state} />
          <FormField label="Branch" value={customer.branch} />
          <FormField label="Date Joined" value={customer.dateJoined} />
        </div>

        {/* Section 2: Office/Business Address */}
        <SectionHeader title="Section 2 — Office / Business Address" />
        <div className="grid grid-cols-1">
          <FormField
            label="Office/Business Address"
            value={customer.officeAddress} />
          
        </div>

        {/* Section 3: Next of Kin */}
        <SectionHeader title="Section 3 — Next of Kin" />
        <div className="grid grid-cols-2">
          <FormField label="Full Name" value={customer.nextOfKin.name} />
          <FormField label="Phone Number" value={customer.nextOfKin.phone} />
          <FormField
            label="Relationship"
            value={customer.nextOfKin.relationship} />
          
          <FormField label="" value="" />
        </div>

        {/* Section 4-6: Guarantors */}
        {customer.guarantors.map((g: any, idx: number) =>
        <Fragment key={idx}>
            <SectionHeader
            title={`Section ${idx + 4} — Guarantor ${idx + 1}`} />
          
            <div className="grid grid-cols-2">
              <FormField label="Full Name" value={g.name} />
              <FormField label="Phone Number" value={g.phone} />
              <div className="col-span-2">
                <FormField label="Address" value={g.address} />
              </div>
              <FormField
              label="Relationship to Customer"
              value={g.relationship} />
            
              <FormField label="Occupation" value={g.occupation} />
              <FormField label="BVN" value={g.bvn} />
              <FormField label="" value="" />
            </div>
          </Fragment>
        )}

        {/* Section 7: Reference Information */}
        <SectionHeader title="Section 7 — Reference Information" />
        <div className="grid grid-cols-2">
          <FormField label="Full Name" value={customer.reference.name} />
          <FormField label="Phone Number" value={customer.reference.phone} />
          <div className="col-span-2">
            <FormField label="Address" value={customer.reference.address} />
          </div>
          <FormField
            label="Relationship"
            value={customer.reference.relationship} />
          
          <FormField label="Occupation" value={customer.reference.occupation} />
          <FormField
            label="Years Known"
            value={customer.reference.yearsKnown} />
          
          <FormField label="" value="" />
        </div>

        {/* Section 8: KYC Status */}
        <SectionHeader title="Section 8 — KYC & Verification Status" />
        <div className="grid grid-cols-2">
          <FormField label="BVN Number" value={customer.kyc.bvn.number} />
          <FormField label="BVN Status" value={customer.kyc.bvn.status} />
          <FormField
            label="NIN Number"
            value={customer.kyc.nin?.number || '—'} />
          
          <FormField
            label="NIN Status"
            value={customer.kyc.nin?.status || '—'} />
          
          <FormField
            label="Biometric Status"
            value={customer.kyc.biometric.status} />
          
          <FormField label="" value="" />
        </div>

        {/* Section 9: Group Membership */}
        <SectionHeader title="Section 9 — Group Membership" />
        <div className="grid grid-cols-2">
          <FormField label="Group Name" value={customer.group.name} />
          <FormField label="Group ID" value={customer.group.id} />
          <FormField label="Role in Group" value={customer.group.role} />
          <FormField label="" value="" />
        </div>

        {/* Signature Section */}
        <div className="mt-10 pt-6 border-t border-gray-300">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-6">
            Signatures & Authorization
          </p>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="border-b border-gray-400 h-16"></div>
              <p className="text-xs text-gray-600 mt-2 font-medium">
                Customer Signature
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Date: _______________
              </p>
            </div>
            <div>
              <div className="border-b border-gray-400 h-16"></div>
              <p className="text-xs text-gray-600 mt-2 font-medium">
                Branch Manager
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Date: _______________
              </p>
            </div>
            <div>
              <div className="border-b border-gray-400 h-16"></div>
              <p className="text-xs text-gray-600 mt-2 font-medium">
                Authorizer
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Date: _______________
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-[10px] text-gray-400">
            This is a computer-generated document from BCKash MFB Portal. Form
            CDF-{customer.id} generated on {today}.
          </p>
        </div>
      </div>
    </div>);

}