import { User } from "src/modules/auth/entities/auth.enity";

export class CoordinatorDto {

    id: string;

    name: string;

    email: string;

    phone: string;

    status: string;

    url?: string | null


    constructor(user: User) {
        this.id = user.id
        this.name = user.name
        this.email = user.email
        this.phone = user.phone
        this.status = user.status.toString()
        if (user.files.length > 0) {
            this.url = user.files[user.files.length - 1].url
        } else {
            this.url = null
        }

    }
    
}