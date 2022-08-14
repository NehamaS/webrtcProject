import { MiddlewareConsumer, NestModule, OnModuleInit } from '@nestjs/common';
import { ReadyService } from "service-infrastructure/health/ready.service";
import { HealthService } from "service-infrastructure/health/health.service";
import { CpuService } from "service-infrastructure/health/cpu/cpu.service";
import { MemoryRssService } from "service-infrastructure/health/memory/memory.rss.service";
export declare class WebrtcModule implements OnModuleInit, NestModule {
    private readonly healthService;
    private readonly readyService;
    private readonly cpuService;
    private readonly memoryRssService;
    constructor(healthService: HealthService, readyService: ReadyService, cpuService: CpuService, memoryRssService: MemoryRssService);
    configure(consumer: MiddlewareConsumer): void;
    onModuleInit(): any;
}
