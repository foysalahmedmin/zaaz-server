import { Document, Model, PipelineStage } from 'mongoose';

interface QueryParams {
  search?: string;
  sort?: string;
  page?: string;
  limit?: string;
  fields?: string;
  is_count_only?: string | boolean;
  [key: string]: unknown;
}

// Internal type to extend the result type with Document properties
type DocumentType<T> = T & Document;

class AppQueryV2<T = any> {
  private pipeline: PipelineStage[];
  private query_params: QueryParams;
  private model: Model<any>;
  private page = 1;
  private limit = 0;
  private baseMatchFilter: Record<string, any> = {};

  constructor(model: Model<any>, query_params: Record<string, unknown>) {
    this.model = model;
    this.query_params = query_params;
    this.pipeline = [];
  }

  search(applicableFields: (keyof T)[]): this {
    const searchValue = this.query_params.search;
    if (searchValue) {
      const searchConditions = {
        $or: applicableFields.map((field) => ({
          [String(field)]: { $regex: searchValue, $options: 'i' },
        })),
      };

      // Find first $match stage
      const matchIndex = this.pipeline.findIndex((stage) => '$match' in stage);

      if (matchIndex >= 0) {
        const matchStage = this.pipeline[matchIndex] as {
          $match: Record<string, any>;
        };
        matchStage.$match = { ...matchStage.$match, ...searchConditions };
      } else {
        // If no $match exists, create one at the beginning
        this.pipeline.unshift({ $match: searchConditions });
      }
    }
    return this;
  }

  filter(applicableFields?: (keyof T)[]): this {
    const queryObj = { ...this.query_params };
    const excludedFields = [
      'search',
      'sort',
      'limit',
      'page',
      'fields',
      'is_count_only',
    ];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Normal filter
    if (applicableFields?.length) {
      Object.keys(queryObj).forEach((key) => {
        if (!applicableFields.includes(key as keyof T)) {
          delete queryObj[key];
        }
      });
    }

    const mongoFilter: Record<string, any> = {};

    // Handle OR
    if (queryObj.or) {
      try {
        mongoFilter.$or = Object.values(queryObj.or).map((cond: any) => cond);
      } catch (e) {
        console.error('Invalid OR format:', e);
      }
      delete queryObj.or;
    }

    // Handle AND
    if (queryObj.and) {
      try {
        mongoFilter.$and = Object.values(queryObj.and).map((cond: any) => cond);
      } catch (e) {
        console.error('Invalid AND format:', e);
      }
      delete queryObj.and;
    }

    // Merge remaining normal filters
    Object.assign(mongoFilter, queryObj);

    // Add to existing $match or create new one
    if (Object.keys(mongoFilter).length > 0) {
      const matchIndex = this.pipeline.findIndex((stage) => '$match' in stage);

      if (matchIndex >= 0) {
        const matchStage = this.pipeline[matchIndex] as {
          $match: Record<string, any>;
        };
        matchStage.$match = { ...matchStage.$match, ...mongoFilter };
      } else {
        // If no $match exists, create one at the beginning
        this.pipeline.unshift({ $match: mongoFilter });
      }

      // Store for count query
      this.baseMatchFilter = { ...this.baseMatchFilter, ...mongoFilter };
    }

    return this;
  }

  sort(applicableFields?: (keyof T)[]): this {
    const rawSort = this.query_params.sort ?? '';
    let fields = rawSort.split(',').filter(Boolean);

    if (applicableFields?.length) {
      fields = fields.filter((field) => {
        const fieldName = field.startsWith('-') ? field.slice(1) : field;
        return applicableFields.includes(fieldName as keyof T);
      });
    }

    // Remove existing $sort if any
    this.pipeline = this.pipeline.filter((stage) => !('$sort' in stage));

    if (fields.length > 0) {
      const sortObj: Record<string, 1 | -1> = {};
      fields.forEach((field) => {
        const fieldName = field.startsWith('-') ? field.slice(1) : field;
        const order = field.startsWith('-') ? -1 : 1;
        sortObj[fieldName] = order;
      });
      this.pipeline.push({ $sort: sortObj });
    } else {
      // Default sort
      this.pipeline.push({ $sort: { created_at: -1 } });
    }

    return this;
  }

  paginate(): this {
    const { page, limit } = this.query_params;

    if (limit && page) {
      this.page = Number(page) || 1;
      this.limit = Number(limit) || 10;
      const skip = (this.page - 1) * this.limit;
      this.pipeline.push({ $skip: skip }, { $limit: this.limit });
    }

    return this;
  }

  fields(applicableFields?: (keyof T)[]): this {
    const rawFields = this.query_params.fields ?? '';
    let selectedFields = rawFields.split(',').filter(Boolean);

    if (applicableFields?.length) {
      selectedFields = selectedFields.filter((field) => {
        const fieldName = field.startsWith('-') ? field.slice(1) : field;
        return applicableFields.includes(fieldName as keyof T);
      });
    }

    // Remove existing $project if any
    this.pipeline = this.pipeline.filter((stage) => !('$project' in stage));

    if (selectedFields.length > 0) {
      const projectObj: Record<string, 1 | 0> = {};
      selectedFields.forEach((field) => {
        const fieldName = field.startsWith('-') ? field.slice(1) : field;
        const include = field.startsWith('-') ? 0 : 1;
        projectObj[fieldName] = include;
      });
      this.pipeline.push({ $project: projectObj });
    }

    return this;
  }

  tap(callback: (pipeline: PipelineStage[]) => PipelineStage[]): this {
    this.pipeline = callback(this.pipeline);
    return this;
  }

  /**
   * Add extra pipeline stages to the current pipeline
   * @param stages - Array of pipeline stages to add
   * @param position - Optional position to insert (default: append at end, before pagination/sort)
   * @returns this for chaining
   */
  addPipeline(stages: PipelineStage[], position?: number): this {
    if (stages.length === 0) {
      return this;
    }

    if (position !== undefined && position >= 0) {
      // Insert at specific position
      this.pipeline.splice(position, 0, ...stages);
    } else {
      // Find the position before $sort, $skip, $limit, $project
      const sortIndex = this.pipeline.findIndex((stage) => '$sort' in stage);
      const skipIndex = this.pipeline.findIndex((stage) => '$skip' in stage);
      const limitIndex = this.pipeline.findIndex((stage) => '$limit' in stage);
      const projectIndex = this.pipeline.findIndex(
        (stage) => '$project' in stage,
      );

      // Find the earliest position among these
      const insertIndex = [sortIndex, skipIndex, limitIndex, projectIndex]
        .filter((idx) => idx >= 0)
        .reduce((min, idx) => (idx < min ? idx : min), this.pipeline.length);

      // Insert before pagination/sort/project stages
      this.pipeline.splice(insertIndex, 0, ...stages);
    }

    return this;
  }

  async execute(
    statisticsQueries?: { key: string; filter: Record<string, any> }[],
  ): Promise<{
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      statistics?: Record<string, number>;
    };
  }> {
    // Build count pipeline (without skip, limit, project)
    const countPipeline: PipelineStage[] = [];

    // Copy all stages except skip, limit, and project
    for (const stage of this.pipeline) {
      if ('$skip' in stage || '$limit' in stage || '$project' in stage) {
        continue;
      }
      // Deep clone to avoid mutating original
      countPipeline.push(JSON.parse(JSON.stringify(stage)));
    }

    // Add count stage
    countPipeline.push({ $count: 'total' });

    // Execute count and data queries in parallel
    const [countResult, stats] = await Promise.all([
      this.model.aggregate(countPipeline),
      statisticsQueries
        ? Promise.all(
            statisticsQueries.map(async (stat) => {
              const statPipeline: PipelineStage[] = [];

              // Copy stages except skip, limit, project
              for (const stage of this.pipeline) {
                if (
                  '$skip' in stage ||
                  '$limit' in stage ||
                  '$project' in stage
                ) {
                  continue;
                }
                statPipeline.push(JSON.parse(JSON.stringify(stage)));
              }

              // Add stat filter to first $match
              const matchIndex = statPipeline.findIndex((s) => '$match' in s);

              if (matchIndex >= 0) {
                const matchStage = statPipeline[matchIndex] as {
                  $match: Record<string, any>;
                };
                matchStage.$match = { ...matchStage.$match, ...stat.filter };
              } else {
                statPipeline.unshift({ $match: stat.filter });
              }

              statPipeline.push({ $count: 'total' });

              const result = await this.model.aggregate(statPipeline);
              return { key: stat.key, count: result[0]?.total || 0 };
            }),
          )
        : Promise.resolve([]),
    ]);

    const total = countResult[0]?.total || 0;

    const statistics =
      stats?.reduce(
        (acc, curr) => {
          acc[curr.key] = curr.count;
          return acc;
        },
        {} as Record<string, number>,
      ) || undefined;

    if (Boolean(this.query_params.is_count_only)) {
      return {
        data: [],
        meta: {
          total,
          page: this.page,
          limit: this.limit,
          statistics,
        },
      };
    }

    // Execute main pipeline
    const data = (await this.model.aggregate(this.pipeline)) as T[];

    return {
      data,
      meta: { total, page: this.page, limit: this.limit, statistics },
    };
  }

  // Helper method to get current pipeline (for debugging)
  getPipeline(): PipelineStage[] {
    return this.pipeline;
  }
}

export default AppQueryV2;
