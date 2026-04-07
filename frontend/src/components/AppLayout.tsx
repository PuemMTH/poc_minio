import { CloudServerOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Badge, Layout, Space, Tag, Typography } from "antd";
import type { ReactNode } from "react";

const { Header, Content, Footer } = Layout;

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Layout
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(28, 88, 126, 0.16), transparent 36%), linear-gradient(180deg, #f4f7fb 0%, #eef3f7 100%)",
      }}
    >
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingInline: 32,
          background: "rgba(7, 20, 34, 0.9)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Space size={12}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, #ff7a45 0%, #ffb347 100%)",
              color: "#101828",
              boxShadow: "0 12px 30px rgba(255, 122, 69, 0.25)",
            }}
          >
            <CloudServerOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <Typography.Title
              level={4}
              style={{ color: "#fff", margin: 0, lineHeight: 1.1 }}
            >
              MinIO File Operations
            </Typography.Title>
            <Typography.Text style={{ color: "rgba(255,255,255,0.72)" }}>
              Upload, review, and distribute assets from one control surface
            </Typography.Text>
          </div>
        </Space>
        <Space size={12}>
          <Badge status="processing" text={<span style={{ color: "#dbe6f3" }}>Live stack</span>} />
          <Tag
            icon={<SafetyCertificateOutlined />}
            color="gold"
            style={{ marginInlineEnd: 0, borderRadius: 999 }}
          >
            Reverse proxied
          </Tag>
        </Space>
      </Header>
      <Content style={{ padding: "32px 24px 24px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>{children}</div>
      </Content>
      <Footer style={{ textAlign: "center", color: "#5b6b7e", background: "transparent" }}>
        Production-ready POC for asset ingestion and object storage workflows
      </Footer>
    </Layout>
  );
}
