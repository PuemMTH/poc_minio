import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import { CloudUploadOutlined, InboxOutlined, LockOutlined } from "@ant-design/icons";
import type { UploadFile as AntUploadFile, UploadProps } from "antd";
import { getApiErrorMessage, uploadFile } from "../api/client";

const { Dragger } = Upload;

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [fileList, setFileList] = useState<AntUploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const queuedBytes = fileList.reduce(
    (total, file) => total + (file.size ?? file.originFileObj?.size ?? 0),
    0
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const handleUpload = async () => {
    if (fileList.length === 0) return;
    setUploading(true);

    let successCount = 0;
    let failCount = 0;

    for (const f of fileList) {
      const file = f.originFileObj;
      if (!file) continue;
      try {
        await uploadFile(file, (percent) => {
          setFileList((prev) =>
            prev.map((item) =>
              item.uid === f.uid ? { ...item, percent, status: "uploading" } : item
            )
          );
        });
        setFileList((prev) =>
          prev.map((item) =>
            item.uid === f.uid ? { ...item, status: "done" } : item
          )
        );
        successCount++;
      } catch (err: unknown) {
        const errorMsg = getApiErrorMessage(err);
        setFileList((prev) =>
          prev.map((item) =>
            item.uid === f.uid ? { ...item, status: "error" } : item
          )
        );
        failCount++;
        message.error(`Failed to upload ${f.name}: ${errorMsg}`);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      message.success(`${successCount} file(s) uploaded successfully`);
      onUploadSuccess();
    }
    if (failCount === 0) {
      setFileList([]);
    }
  };

  const props: UploadProps = {
    multiple: true,
    fileList,
    accept:
      ".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.json,.zip,.tar,.gz,.docx,.xlsx",
    beforeUpload: () => false,
    onChange: (info) => {
      setFileList(
        info.fileList.map((file) => ({
          ...file,
          status: file.status === "removed" ? undefined : file.status,
        }))
      );
    },
    onRemove: (file) => {
      setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    },
    showUploadList: {
      showRemoveIcon: !uploading,
      showPreviewIcon: false,
    },
  };

  return (
    <Card
      style={{
        marginBottom: 24,
        borderRadius: 24,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
      }}
      styles={{ body: { padding: 28 } }}
    >
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} lg={16}>
          <Space direction="vertical" size={8} style={{ display: "flex" }}>
            <Tag color="blue" style={{ width: "fit-content", borderRadius: 999 }}>
              Ingestion pipeline
            </Tag>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Secure upload queue for operational assets
            </Typography.Title>
            <Typography.Paragraph style={{ margin: 0, color: "#526071", fontSize: 16 }}>
              Files are routed through the API, validated, persisted to PostgreSQL,
              and stored in MinIO. This flow keeps auditability and failure handling
              in one place.
            </Typography.Paragraph>
          </Space>
        </Col>
        <Col xs={24} lg={8}>
          <Row gutter={12}>
            <Col span={12}>
              <Card size="small" style={{ borderRadius: 18, background: "#f8fbff" }}>
                <Statistic title="Queued files" value={fileList.length} prefix={<CloudUploadOutlined />} />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" style={{ borderRadius: 18, background: "#fffaf2" }}>
                <Statistic title="Queue size" value={formatBytes(queuedBytes)} />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Divider />

      <Alert
        type="info"
        showIcon
        icon={<LockOutlined />}
        style={{ marginBottom: 20, borderRadius: 16 }}
        message="Upload policy"
        description="Allowed document and image formats up to 100 MB per file. Uploads are stored only after backend validation passes."
      />

      <Dragger
        {...props}
        style={{
          padding: "26px 18px",
          borderRadius: 20,
          background: "linear-gradient(180deg, #fbfdff 0%, #f5f9ff 100%)",
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: "#1677ff" }} />
        </p>
        <p className="ant-upload-text">Drop files here or browse from your device</p>
        <p className="ant-upload-hint">
          Bulk uploads are supported. The queue stays local until you confirm the transfer.
        </p>
      </Dragger>

      {fileList.length > 0 ? (
        <Space direction="vertical" size={12} style={{ display: "flex", marginTop: 18 }}>
          {fileList.map((file) => (
            <Card
              key={file.uid}
              size="small"
              style={{ borderRadius: 16, background: "#fcfdff" }}
            >
              <Space direction="vertical" size={6} style={{ display: "flex" }}>
                <Space style={{ justifyContent: "space-between", width: "100%" }}>
                  <Typography.Text strong ellipsis style={{ maxWidth: "78%" }}>
                    {file.name}
                  </Typography.Text>
                  <Tag color={file.status === "error" ? "red" : file.status === "uploading" ? "blue" : "default"}>
                    {file.status ?? "queued"}
                  </Tag>
                </Space>
                <Typography.Text type="secondary">
                  {formatBytes(file.size ?? 0)}
                </Typography.Text>
                {typeof file.percent === "number" ? (
                  <Progress percent={Math.round(file.percent)} size="small" />
                ) : null}
              </Space>
            </Card>
          ))}
        </Space>
      ) : null}

      <Space style={{ marginTop: 20, justifyContent: "space-between", width: "100%" }} wrap>
        <Typography.Text type="secondary">
          Recommended for operational documents, release bundles, and shared assets.
        </Typography.Text>
        <Space>
          <Button onClick={() => setFileList([])} disabled={fileList.length === 0 || uploading}>
            Clear queue
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={handleUpload}
            disabled={fileList.length === 0}
            loading={uploading}
          >
            {uploading ? "Uploading..." : "Start secure upload"}
          </Button>
        </Space>
      </Space>
    </Card>
  );
}
