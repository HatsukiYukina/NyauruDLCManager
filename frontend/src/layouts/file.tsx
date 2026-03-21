import React, { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { subtitle } from "@/components/primitives";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";

//导入Wails绑定
import { GetFiles, ToggleFile } from "../../wailsjs/go/main/App";

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

//接口
interface FileItem {
  path: string;
  originalPath: string;
  name: string;
  description: string;
  disabled: boolean;
  group?: string;
}

interface FileGroup {
  name: string;        //组名
  files: FileItem[];
  isExpanded: boolean;
}

interface FileManagerProps {
  className?: string;
}

export const FileManager: React.FC<FileManagerProps> = ({ className = "" }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FileItem[]>([]);

  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchAction, setBatchAction] = useState<"enable" | "disable">("enable");

  //文件组状态
  const [fileGroups, setFileGroups] = useState<FileGroup[]>([]);

  //加载文件列表
  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await GetFiles(); //加载文件到data

      //确保data是数组
      const filesArray = Array.isArray(data) ? data : [];
      setFiles(filesArray);

      //按配置文件分组
      const grouped = groupFilesByConfig(filesArray);
      setFileGroups(grouped);

      //更新搜索结果
      setSearchResults(filterFilesBySearch(filesArray, searchQuery));
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      setFiles([]);
      setFileGroups([]); //清空分组
      setSearchResults([]); //清空搜索结果
    } finally {
      setLoading(false);
    }
  };

  //组件加载读取配置
  useEffect(() => {
    loadFiles();
  }, []);

  //搜索过滤函数
  const filterFilesBySearch = (files: FileItem[], query: string): FileItem[] => {
    if (!query.trim()) {
      return []; //搜索框为空返回空数组
    }
    const lowerQuery = query.toLowerCase();
    return files.filter(file =>
      file.name.toLowerCase().includes(lowerQuery) ||
      file.description.toLowerCase().includes(lowerQuery) ||
      file.path.toLowerCase().includes(lowerQuery)
    );
  };

  const groupFilesByConfig = (files: FileItem[]): FileGroup[] => {
    const groups: { [key: string]: FileItem[] } = {};

    files.forEach(file => {
      //如果无则默认
      const groupName = file.group || "未分类";

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(file);
    });

    //转为数组格式
    return Object.entries(groups)
      .map(([name, groupFiles]) => ({
        name,
        files: groupFiles,
        isExpanded: true //默认展开/关闭
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); //按组名排序
  };

  //切换组展开折叠
  const toggleGroup = (groupName: string) => {
    setFileGroups(prevGroups =>
      prevGroups.map(group =>
        group.name === groupName
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  //展开所有组
  const expandAllGroups = () => {
    setFileGroups(prevGroups =>
      prevGroups.map(group => ({ ...group, isExpanded: true }))
    );
  };

  //折叠所有组
  const collapseAllGroups = () => {
    setFileGroups(prevGroups =>
      prevGroups.map(group => ({ ...group, isExpanded: false }))
    );
  };

  //批量处理功能
  const handleBatchToggle = async () => {
    if (batchProcessing) return;

    setBatchModalOpen(false);
    setBatchProcessing(true);

    try {
      //获取所有需要处理的文件
      const filesToProcess = files.filter(file =>
        batchAction === "enable" ? file.disabled : !file.disabled
      );

      //逐个处理文件
      for (const file of filesToProcess) {
        await handleToggleFile(file);
      }
    } catch (error) {
      console.error(error);
      setError(`${error}`);
    } finally {
      setBatchProcessing(false);
      setBatchAction("enable");
    }
  };

  // 打开确认模态框
  const openBatchModal = (action: "enable" | "disable") => {
    setBatchAction(action);
    setBatchModalOpen(true);
  };

  //处理搜索输入变化
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSearchResults(filterFilesBySearch(files, value));
  };

  //清除搜索
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  //切换文件状态
  const handleToggleFile = async (file: FileItem) => {
    try {
      setTogglingId(file.originalPath);
      setError(null);

      const newDisabledState = !file.disabled;

      await ToggleFile(file.originalPath, newDisabledState);

      //更新前端状态
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.originalPath === file.originalPath
            ? {
              ...f,
              disabled: newDisabledState,
              path: newDisabledState
                ? file.originalPath + '.disable'
                : file.originalPath
            }
            : f
        )
      );

      //更新分组后的文件状态
      setFileGroups(prevGroups =>
        prevGroups.map(group => ({
          ...group,
          files: group.files.map(f =>
            f.originalPath === file.originalPath
              ? {
                ...f,
                disabled: newDisabledState,
                path: newDisabledState
                  ? file.originalPath + '.disable'
                  : file.originalPath
              }
              : f
          )
        }))
      );

      //更新搜索结果状态
      setSearchResults(prevResults =>
        prevResults.map(f =>
          f.originalPath === file.originalPath
            ? {
              ...f,
              disabled: newDisabledState,
              path: newDisabledState
                ? file.originalPath + '.disable'
                : file.originalPath
            }
            : f
        )
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setTogglingId(null);
    }
  };

  //获取文件状态颜色
  const getStatusColor = (disabled: boolean) => {
    return disabled ? "danger" : "success";
  };

  //获取文件状态文本
  const getStatusText = (disabled: boolean) => {
    return disabled ? "已禁用" : "已启用";
  };

  return (
    <div className={className}>
      {error && (
        <Card className="w-full max-w-2xl bg-danger-50">
          <CardBody>
            <p className="text-danger">{error}</p>
            <Button
              size="sm"
              color="primary"
              onPress={loadFiles}
              className="mt-2"
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      )}

      {/* 搜索框 */}
      <div className="px-8 mb-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="搜索文件名称、描述或路径  "
            value={searchQuery}
            onValueChange={handleSearchChange}
            startContent={<SearchIcon />}
            endContent={
              searchQuery && (
                <button
                  onClick={clearSearch}
                  className="focus:outline-none"
                >
                  <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )
            }
            className="w-full"
            variant="bordered"
          />
          {searchQuery && (
            <Button size="sm" variant="flat" onPress={clearSearch}>
              清除
            </Button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-default-400 mt-1 ml-1">
            找到{searchResults.length}个匹配的项目
          </p>
        )}
      </div>

      {/*列表显示*/}
      <div className="w-full space-y-4 px-8">
        {searchQuery ? (
          /*搜索结果显示到列表*/
          searchResults.length === 0 ? (
            <Card>
              <CardBody className="text-center py-8">
                <p className="text-default-500">没有找到匹配的项目</p>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={clearSearch}
                  className="mt-2"
                >
                  清除搜索
                </Button>
              </CardBody>
            </Card>
          ) : (
            searchResults.map((file) => (
              <Card key={file.originalPath} className="w-full">
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">
                          {file.name}
                        </h3>
                        <Chip
                          size="sm"
                          color={getStatusColor(file.disabled)}
                          variant="flat"
                        >
                          {getStatusText(file.disabled)}
                        </Chip>
                        {file.group && (
                          <Chip size="sm" variant="light" className="text-xs">
                            {file.group}
                          </Chip>
                        )}
                      </div>

                      <p className="text-xs text-default-500 mb-2">
                        {file.description}
                      </p>
                    </div>

                    {/*开关*/}
                    <div className="flex items-center">
                      <Switch
                        isSelected={!file.disabled}
                        onValueChange={() => handleToggleFile(file)}
                        isDisabled={togglingId === file.originalPath}
                        size="lg"
                        color="success"
                        classNames={{
                          base: "inline-flex flex-row-reverse gap-3",
                          wrapper: `w-12 h-6 group-data-[selected=true]:bg-success-500 group-data-[selected=false]:bg-gray-300 
                                dark:group-data-[selected=false]:bg-gray-600 transition-all duration-300`,
                          thumb: "w-5 h-5 bg-white shadow-md group-data-[selected=true]:ml-6 transition-all duration-300",
                          label: "text-sm font-medium"
                        }}
                      >
                        <span className={file.disabled ? "text-gray-400" : "text-success-500"}>
                          {file.disabled ? "" : ""}
                        </span>
                      </Switch>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          )
        ) : (
          /*无搜索时显示*/
          fileGroups.length === 0 ? (
            <Card>
              <CardBody className="text-center py-8">
                <p className="text-default-500">没有找到合法的文件</p>
              </CardBody>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="flat" onPress={expandAllGroups}>
                    全部展开
                  </Button>
                  <Button size="sm" variant="flat" onPress={collapseAllGroups}>
                    全部折叠
                  </Button>
                  <Button
                    size="sm"
                    color="success"
                    variant="flat"
                    onPress={() => openBatchModal("enable")}
                    isLoading={batchProcessing}
                    isDisabled={batchProcessing}
                  >
                    全部开启
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    onPress={() => openBatchModal("disable")}
                    isLoading={batchProcessing}
                    isDisabled={batchProcessing}
                  >
                    全部关闭
                  </Button>
                  <div className={subtitle({ class: "ml-2 mt-2 text-xs"})}>
                    共{files.length}个可开关项
                  </div>
                </div>
              </div>

              {/*按组渲染*/}
              {fileGroups.map((group) => (
                <div key={group.name} className="space-y-2">
                  <div
                    className="flex items-center gap-2 p-2 bg-default-100 dark:bg-default-50 rounded-lg cursor-pointer hover:bg-default-200 dark:hover:bg-default-100 transition-colors"
                    onClick={() => toggleGroup(group.name)}
                  >
                    <span className="text-xs">
                      {group.isExpanded ? '▼' : '▶'}
                    </span>
                    <h2 className="text-md font-semibold">
                      {group.name}
                    </h2>
                    <span className="text-xs text-default-400">
                      ({group.files.length}个可开关项)
                    </span>
                  </div>

                  {group.isExpanded && (
                    <div className="space-y-4 pl-4">
                      {group.files.map((file) => (
                        <div key={file.originalPath} className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">
                                {file.name}
                              </h3>
                              <Chip
                                size="sm"
                                color={getStatusColor(file.disabled)}
                                variant="flat"
                              >
                                {getStatusText(file.disabled)}
                              </Chip>
                            </div>

                            <p className="text-xs text-default-500 mb-2">
                              {file.description}
                            </p>
                          </div>

                          <div className="flex items-center">
                            <Switch
                              isSelected={!file.disabled}
                              onValueChange={() => handleToggleFile(file)}
                              isDisabled={togglingId === file.originalPath}
                              size="lg"
                              color="success"
                              classNames={{
                                base: "inline-flex flex-row-reverse gap-3",
                                wrapper: `w-12 h-6 group-data-[selected=true]:bg-success-500 group-data-[selected=false]:bg-gray-300 
                                          dark:group-data-[selected=false]:bg-gray-600 transition-all duration-300`,
                                thumb: "w-5 h-5 bg-white shadow-md group-data-[selected=true]:ml-6 transition-all duration-300",
                                label: "text-sm font-medium"
                              }}
                            >
                              <span className={file.disabled ? "text-gray-400" : "text-success-500"}>
                                {file.disabled ? "" : ""}
                              </span>
                            </Switch>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )
        )}
      </div>

      {/*批量操作确认框*/}
      <Modal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {batchAction === "enable" ? "全部开启" : "全部关闭"}
              </ModalHeader>
              <ModalBody>
                <p>
                  确定要{batchAction === "enable" ? "开启" : "关闭"}所有功能吗？
                </p>
                <p className="text-sm text-default-400">
                  这将{batchAction === "enable" ? "开启" : "关闭"}所有
                  <span className="font-bold text-foreground">
                    {files.filter(f => batchAction === "enable" ? f.disabled : !f.disabled).length}
                  </span>
                  个功能，建议谨慎阅读相应功能描述，并确认是否继续。
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onClose}
                >
                  取消
                </Button>
                <Button
                  color={batchAction === "enable" ? "success" : "danger"}
                  onPress={() => {
                    onClose();
                    handleBatchToggle();
                  }}
                  isLoading={batchProcessing}
                >
                  确认{batchAction === "enable" ? "开启" : "关闭"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};