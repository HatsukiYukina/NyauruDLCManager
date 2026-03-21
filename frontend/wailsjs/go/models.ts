export namespace config {
	
	export class Settings {
	    theme: string;
	    language: string;
	    checkUpdates: boolean;
	    updateUrl: string;
	    nativeWindow: boolean;
	    addressUrl: string;
	    latencyTestCount: number;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.language = source["language"];
	        this.checkUpdates = source["checkUpdates"];
	        this.updateUrl = source["updateUrl"];
	        this.nativeWindow = source["nativeWindow"];
	        this.addressUrl = source["addressUrl"];
	        this.latencyTestCount = source["latencyTestCount"];
	    }
	}

}

export namespace cpu {
	
	export class InfoStat {
	    cpu: number;
	    vendorId: string;
	    family: string;
	    model: string;
	    stepping: number;
	    physicalId: string;
	    coreId: string;
	    cores: number;
	    modelName: string;
	    mhz: number;
	    cacheSize: number;
	    flags: string[];
	    microcode: string;
	
	    static createFrom(source: any = {}) {
	        return new InfoStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cpu = source["cpu"];
	        this.vendorId = source["vendorId"];
	        this.family = source["family"];
	        this.model = source["model"];
	        this.stepping = source["stepping"];
	        this.physicalId = source["physicalId"];
	        this.coreId = source["coreId"];
	        this.cores = source["cores"];
	        this.modelName = source["modelName"];
	        this.mhz = source["mhz"];
	        this.cacheSize = source["cacheSize"];
	        this.flags = source["flags"];
	        this.microcode = source["microcode"];
	    }
	}

}

export namespace disk {
	
	export class PartitionStat {
	    device: string;
	    mountpoint: string;
	    fstype: string;
	    opts: string[];
	
	    static createFrom(source: any = {}) {
	        return new PartitionStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.device = source["device"];
	        this.mountpoint = source["mountpoint"];
	        this.fstype = source["fstype"];
	        this.opts = source["opts"];
	    }
	}
	export class UsageStat {
	    path: string;
	    fstype: string;
	    total: number;
	    free: number;
	    used: number;
	    usedPercent: number;
	    inodesTotal: number;
	    inodesUsed: number;
	    inodesFree: number;
	    inodesUsedPercent: number;
	
	    static createFrom(source: any = {}) {
	        return new UsageStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.fstype = source["fstype"];
	        this.total = source["total"];
	        this.free = source["free"];
	        this.used = source["used"];
	        this.usedPercent = source["usedPercent"];
	        this.inodesTotal = source["inodesTotal"];
	        this.inodesUsed = source["inodesUsed"];
	        this.inodesFree = source["inodesFree"];
	        this.inodesUsedPercent = source["inodesUsedPercent"];
	    }
	}

}

export namespace host {
	
	export class InfoStat {
	    hostname: string;
	    uptime: number;
	    bootTime: number;
	    procs: number;
	    os: string;
	    platform: string;
	    platformFamily: string;
	    platformVersion: string;
	    kernelVersion: string;
	    kernelArch: string;
	    virtualizationSystem: string;
	    virtualizationRole: string;
	    hostId: string;
	
	    static createFrom(source: any = {}) {
	        return new InfoStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hostname = source["hostname"];
	        this.uptime = source["uptime"];
	        this.bootTime = source["bootTime"];
	        this.procs = source["procs"];
	        this.os = source["os"];
	        this.platform = source["platform"];
	        this.platformFamily = source["platformFamily"];
	        this.platformVersion = source["platformVersion"];
	        this.kernelVersion = source["kernelVersion"];
	        this.kernelArch = source["kernelArch"];
	        this.virtualizationSystem = source["virtualizationSystem"];
	        this.virtualizationRole = source["virtualizationRole"];
	        this.hostId = source["hostId"];
	    }
	}

}

export namespace main {
	
	export class FileItem {
	    path: string;
	    name: string;
	    description: string;
	    disabled: boolean;
	    originalPath: string;
	    group: string;
	
	    static createFrom(source: any = {}) {
	        return new FileItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.disabled = source["disabled"];
	        this.originalPath = source["originalPath"];
	        this.group = source["group"];
	    }
	}
	export class IPv6Status {
	    hasInternet: boolean;
	    latencyMs: number;
	    publicIPs: string[];
	    details: string;
	
	    static createFrom(source: any = {}) {
	        return new IPv6Status(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hasInternet = source["hasInternet"];
	        this.latencyMs = source["latencyMs"];
	        this.publicIPs = source["publicIPs"];
	        this.details = source["details"];
	    }
	}
	export class STUNResult {
	    natType: string;
	    publicIP: string;
	    publicPort: number;
	    mappedAddresses: string[];
	    latencyMs: number;
	    details: string;
	    serverUsed: string;
	
	    static createFrom(source: any = {}) {
	        return new STUNResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.natType = source["natType"];
	        this.publicIP = source["publicIP"];
	        this.publicPort = source["publicPort"];
	        this.mappedAddresses = source["mappedAddresses"];
	        this.latencyMs = source["latencyMs"];
	        this.details = source["details"];
	        this.serverUsed = source["serverUsed"];
	    }
	}
	export class SystemInfo {
	    cpuInfo: cpu.InfoStat[];
	    cpuPercent: number;
	    cpuPerCore: number[];
	    memory?: mem.VirtualMemoryStat;
	    swap?: mem.SwapMemoryStat;
	    diskPartitions: disk.PartitionStat[];
	    diskUsage: Record<string, disk.UsageStat>;
	    netIOCounters: net.IOCountersStat[];
	    netConnections: net.ConnectionStat[];
	    hostInfo?: host.InfoStat;
	    processCount: number;
	    appVersion: string;
	    goVersion: string;
	
	    static createFrom(source: any = {}) {
	        return new SystemInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cpuInfo = this.convertValues(source["cpuInfo"], cpu.InfoStat);
	        this.cpuPercent = source["cpuPercent"];
	        this.cpuPerCore = source["cpuPerCore"];
	        this.memory = this.convertValues(source["memory"], mem.VirtualMemoryStat);
	        this.swap = this.convertValues(source["swap"], mem.SwapMemoryStat);
	        this.diskPartitions = this.convertValues(source["diskPartitions"], disk.PartitionStat);
	        this.diskUsage = this.convertValues(source["diskUsage"], disk.UsageStat, true);
	        this.netIOCounters = this.convertValues(source["netIOCounters"], net.IOCountersStat);
	        this.netConnections = this.convertValues(source["netConnections"], net.ConnectionStat);
	        this.hostInfo = this.convertValues(source["hostInfo"], host.InfoStat);
	        this.processCount = source["processCount"];
	        this.appVersion = source["appVersion"];
	        this.goVersion = source["goVersion"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace mem {
	
	export class SwapMemoryStat {
	    total: number;
	    used: number;
	    free: number;
	    usedPercent: number;
	    sin: number;
	    sout: number;
	    pgIn: number;
	    pgOut: number;
	    pgFault: number;
	    pgMajFault: number;
	
	    static createFrom(source: any = {}) {
	        return new SwapMemoryStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total = source["total"];
	        this.used = source["used"];
	        this.free = source["free"];
	        this.usedPercent = source["usedPercent"];
	        this.sin = source["sin"];
	        this.sout = source["sout"];
	        this.pgIn = source["pgIn"];
	        this.pgOut = source["pgOut"];
	        this.pgFault = source["pgFault"];
	        this.pgMajFault = source["pgMajFault"];
	    }
	}
	export class VirtualMemoryStat {
	    total: number;
	    available: number;
	    used: number;
	    usedPercent: number;
	    free: number;
	    active: number;
	    inactive: number;
	    wired: number;
	    laundry: number;
	    buffers: number;
	    cached: number;
	    writeBack: number;
	    dirty: number;
	    writeBackTmp: number;
	    shared: number;
	    slab: number;
	    sreclaimable: number;
	    sunreclaim: number;
	    pageTables: number;
	    swapCached: number;
	    commitLimit: number;
	    committedAS: number;
	    highTotal: number;
	    highFree: number;
	    lowTotal: number;
	    lowFree: number;
	    swapTotal: number;
	    swapFree: number;
	    mapped: number;
	    vmallocTotal: number;
	    vmallocUsed: number;
	    vmallocChunk: number;
	    hugePagesTotal: number;
	    hugePagesFree: number;
	    hugePagesRsvd: number;
	    hugePagesSurp: number;
	    hugePageSize: number;
	    anonHugePages: number;
	
	    static createFrom(source: any = {}) {
	        return new VirtualMemoryStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total = source["total"];
	        this.available = source["available"];
	        this.used = source["used"];
	        this.usedPercent = source["usedPercent"];
	        this.free = source["free"];
	        this.active = source["active"];
	        this.inactive = source["inactive"];
	        this.wired = source["wired"];
	        this.laundry = source["laundry"];
	        this.buffers = source["buffers"];
	        this.cached = source["cached"];
	        this.writeBack = source["writeBack"];
	        this.dirty = source["dirty"];
	        this.writeBackTmp = source["writeBackTmp"];
	        this.shared = source["shared"];
	        this.slab = source["slab"];
	        this.sreclaimable = source["sreclaimable"];
	        this.sunreclaim = source["sunreclaim"];
	        this.pageTables = source["pageTables"];
	        this.swapCached = source["swapCached"];
	        this.commitLimit = source["commitLimit"];
	        this.committedAS = source["committedAS"];
	        this.highTotal = source["highTotal"];
	        this.highFree = source["highFree"];
	        this.lowTotal = source["lowTotal"];
	        this.lowFree = source["lowFree"];
	        this.swapTotal = source["swapTotal"];
	        this.swapFree = source["swapFree"];
	        this.mapped = source["mapped"];
	        this.vmallocTotal = source["vmallocTotal"];
	        this.vmallocUsed = source["vmallocUsed"];
	        this.vmallocChunk = source["vmallocChunk"];
	        this.hugePagesTotal = source["hugePagesTotal"];
	        this.hugePagesFree = source["hugePagesFree"];
	        this.hugePagesRsvd = source["hugePagesRsvd"];
	        this.hugePagesSurp = source["hugePagesSurp"];
	        this.hugePageSize = source["hugePageSize"];
	        this.anonHugePages = source["anonHugePages"];
	    }
	}

}

export namespace net {
	
	export class Addr {
	    ip: string;
	    port: number;
	
	    static createFrom(source: any = {}) {
	        return new Addr(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.port = source["port"];
	    }
	}
	export class ConnectionStat {
	    fd: number;
	    family: number;
	    type: number;
	    localaddr: Addr;
	    remoteaddr: Addr;
	    status: string;
	    uids: number[];
	    pid: number;
	
	    static createFrom(source: any = {}) {
	        return new ConnectionStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.fd = source["fd"];
	        this.family = source["family"];
	        this.type = source["type"];
	        this.localaddr = this.convertValues(source["localaddr"], Addr);
	        this.remoteaddr = this.convertValues(source["remoteaddr"], Addr);
	        this.status = source["status"];
	        this.uids = source["uids"];
	        this.pid = source["pid"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class IOCountersStat {
	    name: string;
	    bytesSent: number;
	    bytesRecv: number;
	    packetsSent: number;
	    packetsRecv: number;
	    errin: number;
	    errout: number;
	    dropin: number;
	    dropout: number;
	    fifoin: number;
	    fifoout: number;
	
	    static createFrom(source: any = {}) {
	        return new IOCountersStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.bytesSent = source["bytesSent"];
	        this.bytesRecv = source["bytesRecv"];
	        this.packetsSent = source["packetsSent"];
	        this.packetsRecv = source["packetsRecv"];
	        this.errin = source["errin"];
	        this.errout = source["errout"];
	        this.dropin = source["dropin"];
	        this.dropout = source["dropout"];
	        this.fifoin = source["fifoin"];
	        this.fifoout = source["fifoout"];
	    }
	}

}

