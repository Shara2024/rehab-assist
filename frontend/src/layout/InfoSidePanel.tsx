import { Phone, Mail, MapPin, Building2, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ContactInfo = {
  phone?: string;
  email?: string;
  address?: string;
};

export type RehabCenterContact = ContactInfo & {
  name: string;
};

export type TherapistContact = ContactInfo & {
  name: string;
  role?: string;
};

interface InfoSidePanelProps {
  onClose?: () => void;
  rehabCenter?: RehabCenterContact;
  therapist?: TherapistContact;
}

function ContactBlock({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            className="text-sm font-medium text-primary hover:underline break-words"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  contact,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  contact: ContactInfo;
}) {
  const hasAny = contact.phone || contact.email || contact.address;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold leading-tight">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {contact.phone && (
          <ContactBlock
            icon={Phone}
            label="Phone"
            value={contact.phone}
            href={`tel:${contact.phone}`}
          />
        )}
        {contact.email && (
          <ContactBlock
            icon={Mail}
            label="Email"
            value={contact.email}
            href={`mailto:${contact.email}`}
          />
        )}
        {contact.address && (
          <ContactBlock icon={MapPin} label="Address" value={contact.address} />
        )}
      </div>

      {!hasAny && (
        <p className="text-xs text-muted-foreground py-1">
          No contact details provided.
        </p>
      )}
    </div>
  );
}

export default function InfoSidePanel({
  onClose,
  rehabCenter,
  therapist,
}: InfoSidePanelProps = {}) {
  return (
    <div className="w-full h-full bg-background/95 backdrop-blur-md border-l border-b flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-muted/50">
        <h2 className="font-semibold text-sm">Support &amp; Contact</h2>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        <p className="text-xs text-muted-foreground">
          For further instructions, please reach out to your rehab center or
          therapist below.
        </p>

        {rehabCenter && (
          <Section
            icon={Building2}
            title={rehabCenter.name}
            subtitle="Rehab Center"
            contact={rehabCenter}
          />
        )}

        {therapist && (
          <Section
            icon={UserRound}
            title={therapist.name}
            subtitle={therapist.role ?? "Therapist"}
            contact={therapist}
          />
        )}

        {!rehabCenter && !therapist && (
          <p className="text-sm text-muted-foreground text-center pt-6">
            No contact information available.
          </p>
        )}
      </div>
    </div>
  );
}
