import { useCallback, useEffect, useState } from "react";
import { CheckCircleFilled, DatabaseOutlined, FolderOpenOutlined, SyncOutlined } from "@ant-design/icons";
import { Card, Col, Row, Space, Spin, Statistic, Tag, Typography } from "antd";
import { getApiErrorMessage, getHealth } from "../api/client";
import AppLayout from "../components/AppLayout";
import FileUpload from "../components/FileUpload";
import FileList from "../components/FileList";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [healthStatus, setHealthStatus] = useState<"ok" | "degraded" | "loading">("loading");
  const [summary, setSummary] = useState({ total: 0, recentItems: 0 });
  const [healthMessage, setHealthMessage] = useState("Checking service dependencies");
  const handleUploadSuccess = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const handleListLoaded = useCallback(
    (data: { total: number; recentItems: number }) => {
      setSummary(data);
    },
    []
  );

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const { data } = await getHealth();
        setHealthStatus(data.status === "ok" ? "ok" : "degraded");
        setHealthMessage(
          data.status === "ok"
            ? "Backend, PostgreSQL, and MinIO are available"
            : "One or more dependencies are degraded"
        );
      } catch (error) {
        setHealthStatus("degraded");
        setHealthMessage(getApiErrorMessage(error));
      }
    };

    loadHealth();
  }, [refreshKey]);

  const isHealthy = healthStatus === "ok";

  return (
    <AppLayout>
      <Space direction="vertical" size={24} style={{ display: "flex" }}>
        <Card
          style={{
            borderRadius: 28,
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(8, 26, 44, 0.96) 0%, rgba(20, 48, 81, 0.95) 56%, rgba(255, 122, 69, 0.86) 100%)",
            boxShadow: "0 30px 80px rgba(8, 26, 44, 0.18)",
          }}
          styles={{ body: { padding: 30 } }}
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} lg={14}>
              <Space direction="vertical" size={14} style={{ display: "flex" }}>
                <Tag color={isHealthy ? "success" : healthStatus === "loading" ? "processing" : "error"} style={{ width: "fit-content", borderRadius: 999 }}>
                  {healthStatus === "loading" ? "Checking stack" : isHealthy ? "System ready" : "Action needed"}
                </Tag>
                <Typography.Title level={1} style={{ color: "#fff", margin: 0 }}>
                  Production-shaped file operations dashboard
                </Typography.Title>
                <Typography.Paragraph style={{ color: "rgba(255,255,255,0.82)", margin: 0, fontSize: 17 }}>
                  Keep uploads dependable from browser to backend, track asset volume,
                  and expose a cleaner operational surface for everyday use.
                </Typography.Paragraph>
                <Space wrap>
                  <Tag color="blue">React + Ant Design</Tag>
                  <Tag color="gold">FastAPI mediated upload</Tag>
                  <Tag color="cyan">MinIO object store</Tag>
                  <Tag color="geekblue">PostgreSQL metadata</Tag>
                </Space>
              </Space>
            </Col>
            <Col xs={24} lg={10}>
              <Card style={{ borderRadius: 24, background: "rgba(255,255,255,0.96)" }}>
                <Space direction="vertical" size={12} style={{ display: "flex" }}>
                  <Space>
                    {healthStatus === "loading" ? <Spin size="small" /> : <CheckCircleFilled style={{ color: isHealthy ? "#52c41a" : "#ff4d4f" }} />}
                    <Typography.Text strong>Platform status</Typography.Text>
                  </Space>
                  <Typography.Text type="secondary">{healthMessage}</Typography.Text>
                  <Row gutter={12}>
                    <Col span={8}>
                      <Statistic title="Total files" value={summary.total} prefix={<FolderOpenOutlined />} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="Visible rows" value={summary.recentItems} prefix={<DatabaseOutlined />} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="Refresh key" value={refreshKey} prefix={<SyncOutlined />} />
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>

        <FileUpload onUploadSuccess={handleUploadSuccess} />
        <FileList
          refreshKey={refreshKey}
          onLoaded={handleListLoaded}
        />
      </Space>
    </AppLayout>
  );
}
