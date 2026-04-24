export class CreateLeadDto {
  constructor(data) {
    this.email = data?.email;
    this.source = data?.source;
    this.first_name = data?.first_name;
    this.last_name = data?.last_name;
    this.campaign_id = data?.campaign_id;
  }

  validate() {
    const errors = [];
    if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push("Invalid or missing 'email'");
    }
    if (!this.source) errors.push("Missing 'source'");
    if (!this.first_name) errors.push("Missing 'first_name'");
    if (!this.last_name) errors.push("Missing 'last_name'");
    if (this.campaign_id !== undefined && !Number.isInteger(this.campaign_id)) {
      errors.push("'campaign_id' must be an integer");
    }
    return errors;
  }
}