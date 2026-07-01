import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

export interface CertificateData {
  learnerName: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: Date;
  expiresAt: Date | null;
}

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 12,
    color: "#111827",
    fontFamily: "Helvetica",
  },
  border: {
    flex: 1,
    border: "2 solid #111827",
    borderRadius: 8,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 14, letterSpacing: 2, color: "#6366f1", marginBottom: 8 },
  heading: { fontSize: 26, fontFamily: "Helvetica-Bold", marginBottom: 24 },
  label: { fontSize: 11, color: "#6b7280", marginBottom: 4 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 16 },
  course: { fontSize: 16, marginBottom: 24 },
  row: { flexDirection: "row", gap: 40, marginTop: 24 },
  meta: { alignItems: "center" },
  metaValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  number: { marginTop: 28, fontSize: 10, color: "#6b7280" },
});

function fmt(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function CertificateDoc({ data }: { data: CertificateData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <Text style={styles.brand}>MY CARE ACADEMY</Text>
          <Text style={styles.heading}>Certificate of Completion</Text>
          <Text style={styles.label}>This certifies that</Text>
          <Text style={styles.name}>{data.learnerName}</Text>
          <Text style={styles.label}>has successfully completed</Text>
          <Text style={styles.course}>{data.courseTitle}</Text>

          <View style={styles.row}>
            <View style={styles.meta}>
              <Text style={styles.label}>Issued</Text>
              <Text style={styles.metaValue}>{fmt(data.issuedAt)}</Text>
            </View>
            <View style={styles.meta}>
              <Text style={styles.label}>Expires</Text>
              <Text style={styles.metaValue}>
                {data.expiresAt ? fmt(data.expiresAt) : "Does not expire"}
              </Text>
            </View>
          </View>

          <Text style={styles.number}>
            Certificate no. {data.certificateNumber} · verify at /verify
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateCertificatePdf(
  data: CertificateData,
): Promise<Buffer> {
  return renderToBuffer(<CertificateDoc data={data} />);
}
