import type { Inspection } from '@/lib/inspection';
import type { InspectionFileView } from '@/lib/inspection-file';
import { ContactActions } from '@/components/ContactActions';
import { InspectionStatusButtons } from '@/components/InspectionStatusButtons';
import { InspectionSchedule } from '@/components/InspectionSchedule';
import { InspectionCustomerForm } from '@/components/InspectionCustomerForm';
import { InspectionHistory } from '@/components/InspectionHistory';
import { InspectionNotesForm } from '@/components/InspectionNotesForm';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}

export function InspectionDetail({
  inspection,
  files,
}: {
  inspection: Inspection;
  files: InspectionFileView[];
}) {
  return (
    <>
      <ContactActions phone={inspection.phone} address={inspection.address} />

      <Section title="Status">
        <InspectionStatusButtons
          inspectionId={inspection.id}
          kunde={inspection.name}
          current={inspection.status}
        />
      </Section>

      <Section title="Avtalt">
        <InspectionSchedule
          inspectionId={inspection.id}
          scheduledOn={inspection.scheduled_on}
          scheduledTime={inspection.scheduled_time}
        />
      </Section>

      <Section title="Kunde">
        <InspectionCustomerForm inspection={inspection} />
      </Section>

      <Section title="Internt notat">
        <InspectionNotesForm inspectionId={inspection.id} notes={inspection.notes ?? ''} />
      </Section>

      <Section title="Historikk">
        <InspectionHistory inspectionId={inspection.id} files={files} />
      </Section>
    </>
  );
}
