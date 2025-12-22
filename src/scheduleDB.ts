// IndexedDB wrapper for schedule data
export type Schedule = {
	title: string;
	content: string;
	year: number;
	period: string;
	day: number;
	time: number;
	url: string | null;
};

class ScheduleDB {
	private db: IDBDatabase | null = null;
	private readonly DB_NAME = "utol_schedules";
	private readonly STORE_NAME = "schedules";
	private readonly VERSION = 1;

	/**
	 * Initialize IndexedDB
	 */
	async init(): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.DB_NAME, this.VERSION);

			request.onerror = () => {
				console.error("IndexedDB initialization failed:", request.error);
				reject(request.error);
			};

			request.onsuccess = () => {
				this.db = request.result;
				console.log("IndexedDB initialized successfully");
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create object store if it doesn't exist
				if (!db.objectStoreNames.contains(this.STORE_NAME)) {
					db.createObjectStore(this.STORE_NAME, {
						keyPath: ["day", "time"],
					});
					console.log("Object store created:", this.STORE_NAME);
				}
			};
		});
	}

	/**
	 * Save or update a schedule
	 */
	async saveSchedule(
		day: number,
		time: number,
		schedule: Schedule,
	): Promise<void> {
		if (!this.db) {
			throw new Error("Database not initialized");
		}

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error("Database not initialized"));
				return;
			}

			const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
			const objectStore = transaction.objectStore(this.STORE_NAME);

			const request = objectStore.put(schedule);

			request.onsuccess = () => {
				console.log(`Schedule saved: day=${day}, time=${time}`);
				resolve();
			};

			request.onerror = () => {
				console.error("Failed to save schedule:", request.error);
				reject(request.error);
			};
		});
	}

	/**
	 * Get a single schedule by day and time
	 */
	async getSchedule(day: number, time: number): Promise<Schedule | null> {
		if (!this.db) {
			throw new Error("Database not initialized");
		}

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error("Database not initialized"));
				return;
			}

			const transaction = this.db.transaction([this.STORE_NAME], "readonly");
			const objectStore = transaction.objectStore(this.STORE_NAME);

			const request = objectStore.get([day, time]);

			request.onsuccess = () => {
				resolve(request.result || null);
			};

			request.onerror = () => {
				console.error("Failed to get schedule:", request.error);
				reject(request.error);
			};
		});
	}

	/**
	 * Get all schedules
	 */
	async getAllSchedules(): Promise<Schedule[]> {
		if (!this.db) {
			throw new Error("Database not initialized");
		}

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error("Database not initialized"));
				return;
			}

			const transaction = this.db.transaction([this.STORE_NAME], "readonly");
			const objectStore = transaction.objectStore(this.STORE_NAME);

			const request = objectStore.getAll();

			request.onsuccess = () => {
				resolve(request.result || []);
			};

			request.onerror = () => {
				console.error("Failed to get all schedules:", request.error);
				reject(request.error);
			};
		});
	}

	/**
	 * Delete a schedule by day and time
	 */
	async deleteSchedule(day: number, time: number): Promise<void> {
		if (!this.db) {
			throw new Error("Database not initialized");
		}

		return new Promise((resolve, reject) => {
			if (!this.db) {
				reject(new Error("Database not initialized"));
				return;
			}

			const transaction = this.db.transaction([this.STORE_NAME], "readwrite");
			const objectStore = transaction.objectStore(this.STORE_NAME);

			const request = objectStore.delete([day, time]);

			request.onsuccess = () => {
				console.log(`Schedule deleted: day=${day}, time=${time}`);
				resolve();
			};

			request.onerror = () => {
				console.error("Failed to delete schedule:", request.error);
				reject(request.error);
			};
		});
	}

	/**
	 * Migrate data from chrome.storage.local to IndexedDB
	 * This is a one-time migration that runs on first initialization
	 */
	async migrateFromChromeStorage(): Promise<void> {
		return new Promise((resolve) => {
			chrome.storage.local.get(null, async (items) => {
				const scheduleKeys = Object.keys(items).filter((key) =>
					key.startsWith("schedule_"),
				);

				if (scheduleKeys.length === 0) {
					console.log("No schedules to migrate from chrome.storage.local");
					resolve();
					return;
				}

				console.log(
					`Migrating ${scheduleKeys.length} schedules from chrome.storage.local to IndexedDB...`,
				);

				let migratedCount = 0;
				let skippedCount = 0;

				for (const key of scheduleKeys) {
					const schedule = items[key];

					// Validate schedule data
					if (
						!schedule ||
						typeof schedule !== "object" ||
						!schedule.year ||
						!schedule.period ||
						schedule.day === undefined ||
						schedule.time === undefined
					) {
						console.warn(`Skipping invalid schedule with key: ${key}`);
						skippedCount++;
						continue;
					}

					try {
						// Check if schedule already exists in IndexedDB
						const existing = await this.getSchedule(
							schedule.day,
							schedule.time,
						);

						if (!existing) {
							await this.saveSchedule(schedule.day, schedule.time, schedule);
							migratedCount++;
						} else {
							skippedCount++;
						}

						// Remove from chrome.storage.local after successful migration
						chrome.storage.local.remove(key);
					} catch (error) {
						console.error(`Failed to migrate schedule ${key}:`, error);
					}
				}

				console.log(
					`Migration complete: ${migratedCount} migrated, ${skippedCount} skipped`,
				);
				resolve();
			});
		});
	}
}

// Export singleton instance
export const scheduleDB = new ScheduleDB();
