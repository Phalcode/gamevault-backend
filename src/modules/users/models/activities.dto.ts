import { ApiProperty } from "@nestjs/swagger";
import { Activity } from "./activity.dto";

export class Activities {
  @ApiProperty({
    isArray: true,
    description: "contains all activities of all users.",
  })
  activities: Activity[];

  constructor(activities: Activity[]) {
    this.activities = activities;
  }
}
