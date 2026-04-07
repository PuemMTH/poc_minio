import { useEffect, useState, useCallback } from "react";
import {
  Empty,
  Table,
  Button,
  Input,
  Space,
  Card,
  Typography,
  Popconfirm,
  message,
  Tag,
  Tooltip,
  Segmented,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import {
  getApiErrorMessage,
  listFiles,
  getDownloadHref,
  deleteFile,
  type FileRecord,
} from "../api/client";

interface FileListProps {
  refreshKey: number;
  onLoaded?: (data: { total: number; recentItems: number }) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function FileList({ refreshKey, onLoaded }: FileListProps) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "uploaded">("all");

  useEffect(() => {
    onLoaded?.({ total, recentItems: files.length });
  }, [files.length, onLoaded, total]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listFiles(page, pageSize, search);
      const nextItems =
        statusFilter === "uploaded"
          ? data.items.filter((item) => item.status === "uploaded")
          : data.items;
      setFiles(nextItems);
      setTotal(data.total);
    } catch {
      message.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles, refreshKey]);

  const handleDownload = async (record: FileRecord) => {
    try {
      window.open(getDownloadHref(record.id), "_blank", "noopener,noreferrer");
    } catch (error) {
      message.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (record: FileRecord) => {
    try {
      await deleteFile(record.id);
      message.success("File deleted");
      fetchFiles();
    } catch (error) {
      message.error(getApiErrorMessage(error));
    }
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 20);
  };

  const columns: ColumnsType<FileRecord> = [
    {
      title: "Name",
      dataIndex: "original_name",
      key: "original_name",
      ellipsis: true,
      render: (name: string) => (
        <Tooltip title={name}>
          <span>{name}</span>
        </Tooltip>
      ),
    },
    {
      title: "Type",
      dataIndex: "content_type",
      key: "content_type",
      width: 160,
      render: (ct: string) => <Tag>{ct.split("/").pop()}</Tag>,
    },
    {
      title: "Size",
      dataIndex: "size_bytes",
      key: "size_bytes",
      width: 100,
      render: (v: number) => formatBytes(v),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (s: string) => (
        <Tag color={s === "uploaded" ? "green" : "red"}>{s}</Tag>
      ),
    },
    {
      title: "Uploaded",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          />
          <Popconfirm
            title="Delete this file?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      style={{
        borderRadius: 24,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.06)",
      }}
      styles={{ body: { padding: 28 } }}
    >
      <Space direction="vertical" size={18} style={{ display: "flex" }}>
        <Space style={{ justifyContent: "space-between", width: "100%" }} wrap>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Asset registry
            </Typography.Title>
            <Typography.Text type="secondary">
              Review uploaded files, download delivery links, and remove outdated assets.
            </Typography.Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchFiles}>
            Refresh
          </Button>
        </Space>

        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <Input
            placeholder="Search by file name"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 320, maxWidth: "100%" }}
            allowClear
          />
          <Segmented
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as "all" | "uploaded")}
            options={[
              { label: "All rows", value: "all" },
              { label: "Uploaded only", value: "uploaded" },
            ]}
          />
        </Space>
      </Space>

      <Table<FileRecord>
        columns={columns}
        dataSource={files}
        rowKey="id"
        loading={loading}
        locale={{
          emptyText: (
            <Empty
              description={search ? "No files matched your search." : "No uploaded files yet."}
            />
          ),
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `Total ${t} files`,
        }}
        onChange={handleTableChange}
        style={{ marginTop: 20 }}
      />
    </Card>
  );
}
